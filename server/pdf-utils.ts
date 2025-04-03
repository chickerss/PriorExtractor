import { parsePDF } from './pdf-parse-wrapper';
import { InsertExtractedCode } from '@shared/schema';

// Regular expressions to identify CPT, HCPCS, and PLA codes
const CPT_CODE_REGEX = /\b\d{5}\b/g;
const HCPCS_CODE_REGEX = /\b[A-Z]\d{4}\b/g;
const PLA_CODE_REGEX = /\b\d{4}U\b/g;

/**
 * Extract text content from a PDF buffer
 */
export async function extractTextFromPdf(pdfBuffer: Buffer | ArrayBuffer): Promise<string> {
  try {
    const data = await parsePDF(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract CPT, HCPCS, and PLA codes from text content
 */
export function extractCodesFromText(
  textContent: string, 
  metadata: { payerName: string; year: number; lineOfBusiness: string; sourceFile: string }
): InsertExtractedCode[] {
  const codes: InsertExtractedCode[] = [];
  
  // Extract CPT codes
  const cptMatches = textContent.match(CPT_CODE_REGEX) || [];
  const cptCodes = Array.from(new Set(cptMatches)); // Remove duplicates
  
  // Extract HCPCS codes
  const hcpcsMatches = textContent.match(HCPCS_CODE_REGEX) || [];
  const hcpcsCodes = Array.from(new Set(hcpcsMatches)); // Remove duplicates
  
  // Extract PLA codes
  const plaMatches = textContent.match(PLA_CODE_REGEX) || [];
  const plaCodes = Array.from(new Set(plaMatches)); // Remove duplicates
  
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
  
  // Create code objects for PLA codes
  plaCodes.forEach(code => {
    codes.push({
      code,
      codeType: 'PLA',
      payerName: metadata.payerName,
      lineOfBusiness: metadata.lineOfBusiness,
      year: metadata.year,
      sourceFile: metadata.sourceFile
    });
  });
  
  return codes;
}

/**
 * Process a PDF file to extract CPT, HCPCS, and PLA codes with metadata
 */
export async function processPdf(
  pdfBuffer: ArrayBuffer, 
  metadata: { payerName?: string; year?: number; lineOfBusiness?: string; sourceFile: string }
): Promise<InsertExtractedCode[]> {
  // Extract text from PDF
  const text = await extractTextFromPdf(pdfBuffer);
  
  // Extract codes from text with normalized metadata
  // Create a new metadata object with default values for optional fields
  const normalizedMetadata = {
    payerName: metadata.payerName || "Unknown",
    year: metadata.year || new Date().getFullYear(),
    lineOfBusiness: metadata.lineOfBusiness || "Unknown",
    sourceFile: metadata.sourceFile
  };
  
  const codes = extractCodesFromText(text, normalizedMetadata);
  
  return codes;
}
