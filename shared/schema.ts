import { z } from "zod";

// Define the base schema for extracted codes using Zod directly (no database dependency)
export const extractedCodeSchema = z.object({
  id: z.number().optional(),
  code: z.string().min(1),
  codeType: z.string().min(1), // CPT, HCPCS, or PLA
  payerName: z.string().min(1),
  lineOfBusiness: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  sourceFile: z.string().min(1),
});

// Create the insert schema for extracted codes
export const insertExtractedCodeSchema = extractedCodeSchema.omit({
  id: true,
});

// Create validation schema for file metadata
export const fileMetadataSchema = z.object({
  payerName: z.string().min(1, "Payer name is required"),
  year: z.number().int().min(2000).max(2100),
  lineOfBusiness: z.string().min(1, "Line of business is required"),
});

// Azure connection functionality has been removed

// Types for the application
export type InsertExtractedCode = z.infer<typeof insertExtractedCodeSchema>;
export type ExtractedCode = z.infer<typeof extractedCodeSchema>;
export type FileMetadata = z.infer<typeof fileMetadataSchema>;

// PDF upload and processing types
export interface UploadedFile {
  id: string;
  file: File;
  metadata?: FileMetadata;
  status: 'pending' | 'processing' | 'processed' | 'error';
  error?: string;
}

export interface ProcessedFile extends UploadedFile {
  extractedCodes: ExtractedCode[];
}
