import { parsePDF } from './pdf-parse-wrapper';
import { InsertExtractedCode } from '@shared/schema';

// Regular expressions to identify CPT and HCPCS codes
const CPT_CODE_REGEX = /\b\d{5}\b/g;
const HCPCS_CODE_REGEX = /\b[A-Z]\d{4}\b/g;

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
 * Extract CPT and HCPCS codes from text content
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
 * Process a PDF file to extract CPT and HCPCS codes with metadata
 */
export async function processPdf(
  pdfBuffer: ArrayBuffer, 
  metadata: { payerName: string; year: number; lineOfBusiness: string; sourceFile: string }
): Promise<InsertExtractedCode[]> {
  // Extract text from PDF
  const text = await extractTextFromPdf(pdfBuffer);
  
  // Extract codes from text
  const codes = extractCodesFromText(text, metadata);
  
  return codes;
}
