import { CodeLookupData } from "../shared/schema";

// Sample lookup data - in a real application, this would come from a database or API
// This is a simplified version for demonstration purposes
const codeDatabase: Record<string, CodeLookupData> = {
  // CPT Codes (sample data)
  "99201": {
    category: "Evaluation & Management",
    subcategory: "Office Visit",
    description: "Office or other outpatient visit for the evaluation and management of a new patient (Level 1)"
  },
  "99202": {
    category: "Evaluation & Management",
    subcategory: "Office Visit",
    description: "Office or other outpatient visit for the evaluation and management of a new patient (Level 2)"
  },
  "99213": {
    category: "Evaluation & Management", 
    subcategory: "Established Patient",
    description: "Office or other outpatient visit for the evaluation and management of an established patient (Level 3)"
  },
  "27130": {
    category: "Surgery",
    subcategory: "Musculoskeletal",
    description: "Arthroplasty, acetabular and proximal femoral prosthetic replacement (total hip arthroplasty)"
  },
  
  // HCPCS Codes (sample data)
  "G0008": {
    category: "Preventive Care",
    subcategory: "Immunization",
    description: "Administration of influenza virus vaccine"
  },
  "J0131": {
    category: "Drug Administration",
    subcategory: "Injectable Medications",
    description: "Injection, acetaminophen, 10 mg"
  },
  
  // PLA Codes (sample data)
  "0001U": {
    category: "Pathology & Laboratory",
    subcategory: "Genomic Sequencing",
    description: "Red blood cell antigen typing, DNA, human erythrocyte antigen gene analysis"
  },
  "0002U": {
    category: "Pathology & Laboratory",
    subcategory: "Genomic Sequencing",
    description: "Oncology (colorectal), quantitative assessment of three urine metabolites"
  }
};

/**
 * Looks up a medical code to retrieve its category, subcategory, and description
 * @param code The code to look up (CPT, HCPCS, or PLA code)
 * @returns Object containing category, subcategory, and description, or empty values if not found
 */
export function lookupCode(code: string): CodeLookupData {
  // Try to find the code in our database
  const lookupResult = codeDatabase[code];
  
  // Return the lookup data if found, otherwise return empty values
  if (lookupResult) {
    return lookupResult;
  } else {
    // For any code not in our database, return empty values
    return {
      category: "",
      subcategory: "",
      description: ""
    };
  }
}

/**
 * Enhance extracted codes with lookup data
 * @param extractedCodes Array of extracted codes with basic information
 * @returns The same array with category, subcategory, and description added to each item
 */
export function enhanceWithLookupData<T extends { code: string }>(extractedCodes: T[]): (T & CodeLookupData)[] {
  return extractedCodes.map(code => {
    const lookupData = lookupCode(code.code);
    return {
      ...code,
      ...lookupData
    };
  });
}