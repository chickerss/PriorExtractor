import { AzureConnection } from "@shared/schema";
import { ExtractedCode } from "@shared/schema";
import { generateCSVFromCodes } from "./csv-utils";

/**
 * Upload extracted codes to Azure Databricks
 * This is a simple implementation that uses the Databricks REST API
 */
export async function uploadToAzureDatabricks(
  codes: ExtractedCode[],
  connection: AzureConnection
): Promise<{ success: boolean; message: string }> {
  try {
    if (!codes.length) {
      return { success: false, message: "No codes to upload" };
    }

    const { workspaceUrl, accessToken, directoryPath } = connection;
    
    // Generate CSV content
    const csvContent = generateCSVFromCodes(codes);
    
    // Create a timestamp for the filename
    const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
    const fileName = `extracted_codes_${timestamp}.csv`;
    
    // Construct full path
    const fullPath = `${directoryPath.endsWith("/") ? directoryPath : directoryPath + "/"}${fileName}`;
    
    // Prepare API URL for DBFS API
    const apiUrl = `${workspaceUrl.endsWith("/") ? workspaceUrl.slice(0, -1) : workspaceUrl}/api/2.0/dbfs/put`;
    
    // Convert CSV content to base64
    const contentBase64 = btoa(csvContent);
    
    // API request payload
    const payload = {
      path: fullPath,
      contents: contentBase64,
      overwrite: true
    };
    
    // Make the API request
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload to Azure Databricks: ${response.status} ${errorText}`);
    }
    
    return { 
      success: true, 
      message: `Successfully uploaded ${codes.length} codes to ${fullPath}` 
    };
  } catch (error) {
    console.error("Error uploading to Azure Databricks:", error);
    return { 
      success: false, 
      message: `Upload failed: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}
