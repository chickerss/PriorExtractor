import { InsertExtractedCode, FileMetadata } from '@shared/schema';

// Regular expressions to match CPT and HCPCS codes
const CPT_CODE_REGEX = /\b\d{5}\b/g;
const HCPCS_CODE_REGEX = /\b[A-Z]\d{4}\b/g;

/**
 * Extract text content from a PDF file
 * Note: This is a stub that will use the server-side processing
 * We don't actually extract text in the browser anymore as we're using server-side processing
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  // For client-side testing only - not used in production
  // In production, we use the server-side processing
  return "Placeholder text for client-side testing";
}

/**
 * Extract CPT and HCPCS codes from text content
 */
export function extractCodesFromText(
  textContent: string, 
  metadata: FileMetadata & { sourceFile: string }
): InsertExtractedCode[] {
  const codes: InsertExtractedCode[] = [];
  
  // Extract CPT codes
  const cptMatches = textContent.match(CPT_CODE_REGEX) || [];
  const cptCodes = Array.from(new Set(cptMatches)); // Remove duplicates
  
  // Extract HCPCS codes
  const hcpcsMatches = textContent.match(HCPCS_CODE_REGEX) || [];
  const hcpcsCodes = Array.from(new Set(hcpcsMatches)); // Remove duplicates
  
  // Create code objects for CPT codes
  cptCodes.forEach(code => {
    codes.push({
      code,
      codeType: 'CPT',
      payerName: metadata.payerName,
      lineOfBusiness: metadata.lineOfBusiness,
      year: metadata.year,
      sourceFile: metadata.sourceFile
    });
  });
  
  // Create code objects for HCPCS codes
  hcpcsCodes.forEach(code => {
    codes.push({
      code,
      codeType: 'HCPCS',
      payerName: metadata.payerName,
      lineOfBusiness: metadata.lineOfBusiness,
      year: metadata.year,
      sourceFile: metadata.sourceFile
    });
  });
  
  return codes;
}

/**
 * Process a PDF file to extract CPT and HCPCS codes
 */
export async function processPDFFile(
  file: File, 
  metadata: FileMetadata
): Promise<InsertExtractedCode[]> {
  try {
    const text = await extractTextFromPDF(file);
    const codes = extractCodesFromText(text, {
      ...metadata,
      sourceFile: file.name
    });
    
    return codes;
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}
