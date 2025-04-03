import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the base schema for extracted codes
export const extractedCodes = pgTable("extracted_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  codeType: text("code_type").notNull(), // CPT or HCPCS
  payerName: text("payer_name").notNull(),
  lineOfBusiness: text("line_of_business").notNull(),
  year: integer("year").notNull(),
  sourceFile: text("source_file").notNull(),
});

// Create the insert schema for extracted codes
export const insertExtractedCodeSchema = createInsertSchema(extractedCodes).omit({
  id: true,
});

// Create validation schema for file metadata
export const fileMetadataSchema = z.object({
  payerName: z.string().min(1, "Payer name is required"),
  year: z.number().int().min(2000).max(2100),
  lineOfBusiness: z.string().min(1, "Line of business is required"),
});

// Create validation schema for Azure Databricks connection
export const azureConnectionSchema = z.object({
  workspaceUrl: z.string().url("Please enter a valid workspace URL"),
  accessToken: z.string().min(1, "Access token is required"),
  directoryPath: z.string().min(1, "Directory path is required"),
});

// Types for the application
export type InsertExtractedCode = z.infer<typeof insertExtractedCodeSchema>;
export type ExtractedCode = typeof extractedCodes.$inferSelect;
export type FileMetadata = z.infer<typeof fileMetadataSchema>;
export type AzureConnection = z.infer<typeof azureConnectionSchema>;

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
