import streamlit as st
import pandas as pd
import requests
import os
import io
import json
from datetime import datetime

# Set page config
st.set_page_config(
    page_title="Prior Auth Manager",
    page_icon="📋",
    layout="wide"
)

# API base URL
API_BASE_URL = "http://localhost:5001/api"

# Define state variables
if 'extracted_codes' not in st.session_state:
    st.session_state.extracted_codes = []
if 'uploaded_files' not in st.session_state:
    st.session_state.uploaded_files = []

# Function to get all codes
def get_all_codes():
    try:
        response = requests.get(f"{API_BASE_URL}/codes")
        if response.status_code == 200:
            st.session_state.extracted_codes = response.json()
            return response.json()
        else:
            st.error(f"Error fetching codes: {response.text}")
            return []
    except Exception as e:
        st.error(f"Error connecting to API: {str(e)}")
        return []

# Function to process PDF file
def process_pdf(file, metadata):
    try:
        # Create a form-data request
        files = {'file': (file.name, file, 'application/pdf')}
        data = {
            'payer_name': metadata['payer_name'],
            'year': metadata['year'],
            'line_of_business': metadata['line_of_business']
        }
        
        response = requests.post(f"{API_BASE_URL}/process-pdf", files=files, data=data)
        
        if response.status_code == 200:
            result = response.json()
            st.success(f"Successfully processed {file.name}")
            # Update extracted codes
            get_all_codes()
            return True
        else:
            st.error(f"Error processing PDF: {response.text}")
            return False
    except Exception as e:
        st.error(f"Error connecting to API: {str(e)}")
        return False

# Function to download CSV
def download_csv():
    try:
        response = requests.get(f"{API_BASE_URL}/export-csv")
        if response.status_code == 200:
            return response.content
        else:
            st.error(f"Error downloading CSV: {response.text}")
            return None
    except Exception as e:
        st.error(f"Error connecting to API: {str(e)}")
        return None

# Function to upload to Azure
def upload_to_azure(connection):
    try:
        response = requests.post(
            f"{API_BASE_URL}/upload-to-azure",
            json=connection
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                st.success(result.get('message'))
            else:
                st.error(result.get('message'))
            return result
        else:
            st.error(f"Error uploading to Azure: {response.text}")
            return {'success': False, 'message': response.text}
    except Exception as e:
        st.error(f"Error connecting to API: {str(e)}")
        return {'success': False, 'message': str(e)}

# Define page header
st.title("Prior Authorization Code Extractor")
st.write("Upload, extract, and manage CPT, HCPCS, and PLA codes from multiple payers")

# Create a two-column layout
col1, col2 = st.columns([1, 1])

# File upload and metadata section
with col1:
    st.header("Upload Documents")
    
    # File uploader
    uploaded_file = st.file_uploader("Upload PDF files", type=["pdf"], accept_multiple_files=False)
    
    if uploaded_file is not None:
        st.write(f"Selected file: {uploaded_file.name}")
        
        # Display metadata form
        st.subheader("File Metadata")
        
        with st.form("metadata_form"):
            payer_name = st.text_input("Payer Name", placeholder="e.g., Anthem, UnitedHealthcare")
            
            # Year selection
            current_year = datetime.now().year
            years = list(range(2020, current_year + 1))
            year = st.selectbox("Year", options=years, index=len(years) - 1)
            
            # Line of business selection
            lines_of_business = ["Medicare", "Medicaid", "Commercial", "Marketplace", "Other"]
            line_of_business = st.selectbox("Line of Business", options=lines_of_business)
            
            # Process button
            process_button = st.form_submit_button("Process File")
            
            if process_button:
                if not payer_name:
                    st.error("Please enter a payer name")
                else:
                    metadata = {
                        'payer_name': payer_name,
                        'year': year,
                        'line_of_business': line_of_business
                    }
                    
                    # Process the file and add to uploaded files if successful
                    if process_pdf(uploaded_file, metadata):
                        if uploaded_file.name not in [f['name'] for f in st.session_state.uploaded_files]:
                            st.session_state.uploaded_files.append({
                                'name': uploaded_file.name,
                                'payer_name': payer_name,
                                'year': year,
                                'line_of_business': line_of_business,
                                'processed': True
                            })
    
    # Display uploaded files
    if st.session_state.uploaded_files:
        st.subheader("Uploaded Files")
        for idx, file in enumerate(st.session_state.uploaded_files):
            st.write(f"{idx + 1}. {file['name']} - {file['payer_name']} ({file['year']}, {file['line_of_business']})")

# Results section
with col2:
    st.header("Extracted Data")
    
    # Get all codes when the page loads
    if not st.session_state.extracted_codes:
        get_all_codes()
    
    # Filter and sort controls
    col_search, col_filter = st.columns([2, 1])
    
    with col_search:
        search_term = st.text_input("Search codes, payers, or descriptions", placeholder="Enter search term...")
    
    with col_filter:
        if st.button("Refresh Data"):
            get_all_codes()
    
    # Create DataFrame from extracted codes
    if st.session_state.extracted_codes:
        df = pd.DataFrame(st.session_state.extracted_codes)
        
        # Apply search filter if needed
        if search_term:
            # Convert all columns to string for searching
            df_str = df.astype(str)
            
            # Check if any column contains the search term
            mask = df_str.apply(lambda x: x.str.contains(search_term, case=False)).any(axis=1)
            filtered_df = df[mask]
        else:
            filtered_df = df
        
        # Display results
        st.write(f"Showing {len(filtered_df)} of {len(df)} codes")
        st.dataframe(filtered_df, use_container_width=True)
        
        # Download and upload buttons
        col_download, col_upload = st.columns([1, 1])
        
        with col_download:
            if st.button("Download CSV"):
                csv_data = download_csv()
                if csv_data:
                    st.download_button(
                        label="Download CSV File",
                        data=csv_data,
                        file_name="extracted_codes.csv",
                        mime="text/csv"
                    )
        
        with col_upload:
            if st.button("Upload to Azure"):
                st.session_state.show_azure_form = True
    else:
        st.info("No codes extracted yet. Upload and process PDF files to extract codes.")

# Azure upload form (conditionally displayed)
if st.session_state.get('show_azure_form', False):
    st.subheader("Azure Databricks Connection")
    
    with st.form("azure_form"):
        workspace_url = st.text_input("Workspace URL", placeholder="https://adb-xxx.azuredatabricks.net")
        access_token = st.text_input("Access Token", type="password")
        directory_path = st.text_input("Directory Path", placeholder="/FileStore/tables/extracted_codes")
        
        submit_button = st.form_submit_button("Upload")
        
        if submit_button:
            if not workspace_url or not access_token or not directory_path:
                st.error("Please fill out all Azure connection details")
            else:
                connection = {
                    'workspace_url': workspace_url,
                    'access_token': access_token,
                    'directory_path': directory_path
                }
                upload_to_azure(connection)
                st.session_state.show_azure_form = False

# Footer
st.markdown("---")
st.write("© 2023 Prior Authorization Manager. All rights reserved.")