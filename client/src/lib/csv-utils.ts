import { ExtractedCode } from "@shared/schema";

/**
 * Generate CSV content from extracted codes
 */
export function generateCSVFromCodes(codes: ExtractedCode[]): string {
  if (!codes.length) {
    return "";
  }
  
  // Define headers (reordered as requested)
  const headers = ["Payer", "Plan", "Line of Business", "Year", "Code Type", "Code", "Source File"];
  
  // Create CSV header row
  const csvContent = [
    headers.join(","),
    // Map each code to a CSV row (reordered to match headers)
    ...codes.map(code => [
      // Escape values that might contain commas
      `"${code.payerName?.replace(/"/g, '""') || ""}"`,
      `"${code.planName?.replace(/"/g, '""') || ""}"`,
      `"${code.lineOfBusiness?.replace(/"/g, '""') || ""}"`,
      code.year || "",
      code.codeType || "",
      code.code || "",
      `"${code.sourceFile?.replace(/"/g, '""') || ""}"`
    ].join(","))
  ].join("\n");
  
  return csvContent;
}

/**
 * Download CSV data as a file
 */
export function downloadCSV(csvContent: string, fileName: string = "extracted-codes.csv"): void {
  // Create a blob with the CSV content
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  
  // Create a download link
  const link = document.createElement("a");
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Set the link properties
  link.href = url;
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  
  // Add the link to the DOM
  document.body.appendChild(link);
  
  // Click the link to trigger download
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download extracted codes as CSV
 */
export function downloadExtractedCodesAsCSV(codes: ExtractedCode[], fileName: string = "extracted-codes.csv"): void {
  const csvContent = generateCSVFromCodes(codes);
  downloadCSV(csvContent, fileName);
}
