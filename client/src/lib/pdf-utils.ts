import { InsertExtractedCode, FileMetadata } from '@shared/schema';

// Regular expressions to match CPT, HCPCS, and PLA codes
const CPT_CODE_REGEX = /\b\d{5}\b/g;
const HCPCS_CODE_REGEX = /\b[A-Z]\d{4}\b/g;
const PLA_CODE_REGEX = /\b\d{4}U\b/g;

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
 * Extract CPT, HCPCS, and PLA codes from text content
 */
export function extractCodesFromText(
  textContent: string, 
  metadata: { 
    payerName?: string; 
    planName?: string; 
    year?: number; 
    lineOfBusiness?: string; 
    sourceFile: string 
  }
): Array<Omit<InsertExtractedCode, 'payerName' | 'lineOfBusiness' | 'year'> & { 
  payerName: string;
  lineOfBusiness: string;
  year: number;
}> {
  const codes: Array<Omit<InsertExtractedCode, 'payerName' | 'lineOfBusiness' | 'year'> & { 
    payerName: string;
    lineOfBusiness: string;
    year: number;
  }> = [];
  
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
      payerName: metadata.payerName || "Unknown",
      planName: metadata.planName,
      lineOfBusiness: metadata.lineOfBusiness || "Unknown",
      year: metadata.year || new Date().getFullYear(),
      sourceFile: metadata.sourceFile
    });
  });
  
  // Create code objects for HCPCS codes
  hcpcsCodes.forEach(code => {
    codes.push({
      code,
      codeType: 'HCPCS',
      payerName: metadata.payerName || "Unknown",
      planName: metadata.planName,
      lineOfBusiness: metadata.lineOfBusiness || "Unknown",
      year: metadata.year || new Date().getFullYear(),
      sourceFile: metadata.sourceFile
    });
  });
  
  // Create code objects for PLA codes
  plaCodes.forEach(code => {
    codes.push({
      code,
      codeType: 'PLA',
      payerName: metadata.payerName || "Unknown",
      planName: metadata.planName,
      lineOfBusiness: metadata.lineOfBusiness || "Unknown",
      year: metadata.year || new Date().getFullYear(),
      sourceFile: metadata.sourceFile
    });
  });
  
  return codes;
}

/**
 * Process a PDF file to extract CPT, HCPCS, and PLA codes
 */
export async function processPDFFile(
  file: File, 
  metadata: FileMetadata
): Promise<Array<Omit<InsertExtractedCode, 'payerName' | 'lineOfBusiness' | 'year'> & { 
  payerName: string;
  lineOfBusiness: string;
  year: number;
}>> {
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
