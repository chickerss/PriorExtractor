import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { processPdf } from "./pdf-utils";
import { fileMetadataSchema, insertExtractedCodeSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { createObjectCsvStringifier } from "csv-writer";

// Set up multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Route to get all extracted codes
  app.get("/api/codes", async (_req: Request, res: Response) => {
    try {
      const codes = await storage.getExtractedCodes();
      return res.json(codes);
    } catch (error) {
      console.error("Error fetching codes:", error);
      return res.status(500).json({ message: "Failed to fetch codes" });
    }
  });

  // Route to search for codes
  app.get("/api/codes/search", async (req: Request, res: Response) => {
    try {
      const { term, payer, lob, year } = req.query;
      
      let codes = await storage.getExtractedCodes();
      
      // Apply filters if provided
      if (term && typeof term === "string") {
        codes = await storage.searchExtractedCodes(term);
      }
      
      if (payer && typeof payer === "string") {
        codes = codes.filter(code => code.payerName.toLowerCase() === payer.toLowerCase());
      }
      
      if (lob && typeof lob === "string") {
        codes = codes.filter(code => code.lineOfBusiness.toLowerCase() === lob.toLowerCase());
      }
      
      if (year && !isNaN(Number(year))) {
        codes = codes.filter(code => code.year === Number(year));
      }
      
      return res.json(codes);
    } catch (error) {
      console.error("Error searching codes:", error);
      return res.status(500).json({ message: "Failed to search codes" });
    }
  });

  // Route to get unique payers
  app.get("/api/payers", async (_req: Request, res: Response) => {
    try {
      const codes = await storage.getExtractedCodes();
      const payers = [...new Set(codes.map(code => code.payerName))];
      return res.json(payers);
    } catch (error) {
      console.error("Error fetching payers:", error);
      return res.status(500).json({ message: "Failed to fetch payers" });
    }
  });

  // Route to get unique lines of business
  app.get("/api/lines-of-business", async (_req: Request, res: Response) => {
    try {
      const codes = await storage.getExtractedCodes();
      const lobs = [...new Set(codes.map(code => code.lineOfBusiness))];
      return res.json(lobs);
    } catch (error) {
      console.error("Error fetching lines of business:", error);
      return res.status(500).json({ message: "Failed to fetch lines of business" });
    }
  });

  // Route to process a PDF file and extract codes
  app.post("/api/process-pdf", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      console.log("Processing PDF file with form data:", req.body);
      
      // Use the metadata values from the request, with the original filename as default
      // Always use the values from the form if they are provided, don't check if they exist
      const metadataRaw: any = {
        sourceFile: req.file.originalname,
        payerName: req.body.payer_name || "Unknown Payer",
        planName: req.body.plan_name || req.file.originalname,
        year: req.body.year ? parseInt(req.body.year, 10) : new Date().getFullYear(),
        lineOfBusiness: req.body.line_of_business || "Unknown"
      };
      
      console.log("Using metadata:", metadataRaw);
      
      // Process the PDF file with the metadata (default or provided)
      const extractedCodes = await processPdf(req.file.buffer, metadataRaw);
      
      // Save the extracted codes to storage
      const savedCodes = await storage.saveExtractedCodes(extractedCodes);
      
      return res.json({ 
        message: "PDF processed successfully", 
        codesExtracted: savedCodes.length,
        codes: savedCodes 
      });
    } catch (error) {
      console.error("Error processing PDF:", error);
      return res.status(500).json({ 
        message: "Failed to process PDF",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Route to save codes directly (for client-side processing)
  app.post("/api/codes", async (req: Request, res: Response) => {
    try {
      const codes = req.body;
      
      // Validate codes using the zod schema
      try {
        codes.forEach((code: any) => {
          insertExtractedCodeSchema.parse(code);
        });
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ 
            message: "Invalid code data",
            errors: fromZodError(error).message
          });
        }
        throw error;
      }
      
      // Save the codes to storage
      const savedCodes = await storage.saveExtractedCodes(codes);
      
      return res.json({ 
        message: "Codes saved successfully", 
        count: savedCodes.length,
        codes: savedCodes 
      });
    } catch (error) {
      console.error("Error saving codes:", error);
      return res.status(500).json({ message: "Failed to save codes" });
    }
  });

  // Route to generate CSV
  app.get("/api/export-csv", async (_req: Request, res: Response) => {
    try {
      const codes = await storage.getExtractedCodes();
      
      if (codes.length === 0) {
        return res.status(404).json({ message: "No codes found to export" });
      }
      
      // Create CSV stringifier with reordered fields
      const csvStringifier = createObjectCsvStringifier({
        header: [
          { id: 'payerName', title: 'Payer' },
          { id: 'planName', title: 'Plan' },
          { id: 'lineOfBusiness', title: 'Line of Business' },
          { id: 'year', title: 'Year' },
          { id: 'codeType', title: 'Code Type' },
          { id: 'code', title: 'Code' },
          { id: 'sourceFile', title: 'Source File' },
        ]
      });
      
      // Create CSV content
      const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(codes);
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="extracted-codes.csv"');
      
      return res.send(csvContent);
    } catch (error) {
      console.error("Error generating CSV:", error);
      return res.status(500).json({ message: "Failed to generate CSV" });
    }
  });

  // Route to clear all codes (useful for testing)
  app.delete("/api/codes", async (_req: Request, res: Response) => {
    try {
      await storage.clearAllCodes();
      return res.json({ message: "All codes cleared successfully" });
    } catch (error) {
      console.error("Error clearing codes:", error);
      return res.status(500).json({ message: "Failed to clear codes" });
    }
  });

  return httpServer;
}
