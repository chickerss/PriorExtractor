import { z } from "zod";

// Define the base schema for extracted codes using Zod directly (no database dependency)
export const extractedCodeSchema = z.object({
  id: z.number().optional(),
  code: z.string().min(1),
  codeType: z.string().min(1), // CPT, HCPCS, or PLA
  payerName: z.string().min(1),
  planName: z.string().optional(),
  lineOfBusiness: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  sourceFile: z.string().min(1),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  description: z.string().optional(),
});

// Create the insert schema for extracted codes
export const insertExtractedCodeSchema = extractedCodeSchema.omit({
  id: true,
});

// Create validation schema for file metadata
export const fileMetadataSchema = z.object({
  payerName: z.string().optional(),
  planName: z.string().optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  lineOfBusiness: z.string().optional(),
});

// Define Azure connection schema
export const azureConnectionSchema = z.object({
  workspaceUrl: z.string().url(),
  accessToken: z.string().min(1),
  directoryPath: z.string().min(1),
});

export type AzureConnection = z.infer<typeof azureConnectionSchema>;

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

// Interface for code lookup information
export interface CodeLookupData {
  category: string;
  subcategory: string;
  description: string;
}
