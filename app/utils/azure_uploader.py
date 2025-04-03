import requests
import json
import pandas as pd
from io import StringIO

def upload_to_azure_databricks(codes, connection):
    """
    Upload extracted codes to Azure Databricks
    Args:
        codes: List of dictionaries containing extracted codes
        connection: Dictionary containing Azure Databricks connection details
            (workspace_url, access_token, directory_path)
    Returns:
        dict: Result of the upload operation
    """
    if not codes:
        return {"success": False, "message": "No codes to upload"}
    
    try:
        # Convert codes to DataFrame
        df = pd.DataFrame(codes)
        
        # Convert DataFrame to CSV string
        csv_buffer = StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_string = csv_buffer.getvalue()
        
        # Prepare the API endpoint
        api_url = f"{connection['workspace_url']}/api/2.0/dbfs/put"
        
        # Prepare the headers
        headers = {
            "Authorization": f"Bearer {connection['access_token']}",
            "Content-Type": "application/json"
        }
        
        # Prepare the file path in DBFS
        file_path = f"{connection['directory_path']}/extracted_codes.csv"
        
        # Prepare the request payload
        payload = {
            "path": file_path,
            "contents": csv_string,
            "overwrite": True
        }
        
        # Make the API request
        response = requests.post(
            api_url,
            headers=headers,
            data=json.dumps(payload)
        )
        
        # Check if the request was successful
        if response.status_code == 200:
            return {
                "success": True,
                "message": f"Codes successfully uploaded to Azure Databricks at {file_path}"
            }
        else:
            return {
                "success": False,
                "message": f"Failed to upload to Azure Databricks: {response.text}"
            }
    
    except Exception as e:
        return {
            "success": False,
            "message": f"Error uploading to Azure Databricks: {str(e)}"
        }