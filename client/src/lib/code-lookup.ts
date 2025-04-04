import { CodeLookupData } from "@shared/schema";

// Define code ranges for category and description lookup
const codeRanges: Record<string, { category: string; description: string }> = {
  // CPT Code Ranges
  "00100-01999": { category: "Anesthesia", description: "Anesthesia for surgical procedures" },
  "10021-69990": { category: "Surgery", description: "Surgical procedures across body systems" },
  "70010-79999": { category: "Radiology", description: "Diagnostic imaging and radiation oncology services" },
  "80047-89398": { category: "Pathology and Laboratory", description: "Lab tests including blood panels and cytopathology" },
  "90281-99607": { category: "Medicine", description: "Medical services such as immunology, psychiatry, dialysis" },
  "99202-99499": { category: "Evaluation and Management", description: "Office visits, hospital care, consultations" },
  "0001U-0389U": { category: "PLA (Proprietary Lab Analyses)", description: "Lab tests assigned to specific manufacturers" },
  "99091-99499": { category: "E/M (Misc)", description: "Additional evaluation and management services" },

  // HCPCS Code Ranges (Level II)
  "A0000-A0999": { category: "Transportation Services", description: "Ambulance and non-emergency transport" },
  "B0000-B9999": { category: "Enteral and Parenteral Therapy", description: "Nutritional therapy and equipment" },
  "C0000-C9999": { category: "Temporary Codes", description: "Temporary outpatient hospital codes (CMS)" },
  "D0000-D9999": { category: "Dental Procedures", description: "Dental services and procedures" },
  "E0000-E9999": { category: "Durable Medical Equipment", description: "Wheelchairs, prosthetics, oxygen equipment" },
  "G0000-G9999": { category: "Procedures & Professional Services", description: "CMS-assigned codes for Medicare services" },
  "H0000-H9999": { category: "Behavioral Health", description: "Mental health, substance abuse treatment" },
  "J0000-J9999": { category: "Drugs (Injectable)", description: "Drugs administered other than oral method" },
  "K0000-K9999": { category: "Temporary Codes", description: "Temporary DME codes not covered elsewhere" },
  "L0000-L9999": { category: "Orthotics and Prosthetics", description: "Braces, artificial limbs" },
  "M0000-M9999": { category: "Medical Services", description: "Therapy, assessments, and testing" },
  "P0000-P9999": { category: "Pathology and Lab", description: "Clinical diagnostic lab services" },
  "Q0000-Q9999": { category: "Temporary Codes", description: "CMS-assigned temporary codes" },
  "R0000-R9999": { category: "Diagnostic Radiology", description: "Radiopharmaceutical imaging and testing" },
  "S0000-S9999": { category: "Private Payer Codes", description: "HCPCS codes used by commercial payers" },
  "T0000-T9999": { category: "State Medicaid Codes", description: "Medicaid-specific services and supplies" },
  "V0000-V9999": { category: "Vision and Hearing", description: "Eyeglasses, hearing aids, lenses" }
};

/**
 * Determines if a code falls within a specific range
 * @param code The medical code to check
 * @param range The range in format "start-end" (e.g., "10021-69990")
 * @returns True if the code is within the range
 */
function isCodeInRange(code: string, range: string): boolean {
  // Handle special case for PLA codes (they end with 'U')
  if (range === "0001U-0389U") {
    if (!code.endsWith('U')) return false;
    const numericPart = parseInt(code.slice(0, -1), 10);
    const [start, end] = range.split('-').map(r => parseInt(r.slice(0, -1), 10));
    return numericPart >= start && numericPart <= end;
  }
  
  // For regular codes
  const [start, end] = range.split('-').map(r => {
    // Strip any leading alphabetic characters for HCPCS codes
    const match = r.match(/^[A-Z]*(\d+)$/);
    return match ? parseInt(match[1], 10) : parseInt(r, 10);
  });
  
  // Extract the numeric part and any prefix for comparison
  const prefix = code.match(/^[A-Z]+/)?.[0] || '';
  const numericPart = parseInt(code.replace(/^[A-Z]+/, ''), 10);
  
  // For HCPCS codes (they start with letters)
  if (prefix) {
    // Check if the range is for the same prefix
    const rangePrefix = range.match(/^[A-Z]+/)?.[0] || '';
    return prefix === rangePrefix && numericPart >= start && numericPart <= end;
  }
  
  // For CPT codes (numeric only)
  return numericPart >= start && numericPart <= end;
}

/**
 * Looks up a medical code to retrieve its category, subcategory, and description
 * @param code The code to look up (CPT, HCPCS, or PLA code)
 * @returns Object containing category, subcategory, and description, or empty values if not found
 */
export function lookupCode(code: string): CodeLookupData {
  // Determine code type for subcategory
  let subcategory = "";
  
  if (code.match(/^\d+$/)) {
    subcategory = "CPT Code";
  } else if (code.endsWith('U')) {
    subcategory = "PLA Code";
  } else if (code.match(/^[A-Z]\d+$/)) {
    subcategory = "HCPCS Code";
  }
  
  // Find the range that contains this code
  for (const [range, data] of Object.entries(codeRanges)) {
    if (isCodeInRange(code, range)) {
      return {
        category: data.category,
        subcategory,
        description: data.description
      };
    }
  }
  
  // If no range is found, return empty values
  return {
    category: "",
    subcategory,
    description: ""
  };
}

/**
 * Batch lookup for multiple codes at once
 * @param codes Array of codes to look up
 * @returns Object with codes as keys and lookup data as values
 */
export function batchLookupCodes(codes: string[]): Record<string, CodeLookupData> {
  const results: Record<string, CodeLookupData> = {};
  
  for (const code of codes) {
    results[code] = lookupCode(code);
  }
  
  return results;
}