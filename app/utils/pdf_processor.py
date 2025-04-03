import io
import re
import pdfplumber
from PyPDF2 import PdfReader
import sys
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def extract_text_from_pdf(pdf_file_content):
    """
    Extract text content from a PDF file
    Args:
        pdf_file_content: PDF file content as bytes or BytesIO object
    Returns:
        str: Extracted text content
    """
    logger.info("Starting text extraction from PDF")
    
    if isinstance(pdf_file_content, bytes):
        pdf_file_content = io.BytesIO(pdf_file_content)
    
    all_text = ""
    
    # First try with pdfplumber which handles most PDFs well
    try:
        with pdfplumber.open(pdf_file_content) as pdf:
            for page in pdf.pages:
                text = page.extract_text() or ""
                all_text += text + "\n\n"
        
        if all_text.strip():
            logger.info("Successfully extracted text with pdfplumber")
            return all_text
    except Exception as e:
        logger.warning(f"Error extracting text with pdfplumber: {str(e)}")
    
    # Fallback to PyPDF2 if pdfplumber fails
    try:
        pdf_file_content.seek(0)  # Reset file pointer
        reader = PdfReader(pdf_file_content)
        for page in reader.pages:
            text = page.extract_text() or ""
            all_text += text + "\n\n"
        
        logger.info("Successfully extracted text with PyPDF2")
        return all_text
    except Exception as e:
        logger.error(f"Error extracting text with PyPDF2: {str(e)}")
        raise Exception(f"Failed to extract text from PDF: {str(e)}")

def extract_codes_from_text(text, metadata):
    """
    Extract CPT, HCPCS, and PLA codes from text content
    Args:
        text: Text content from PDF
        metadata: Dictionary containing payer_name, year, and line_of_business
    Returns:
        list: List of dictionaries containing the extracted codes with metadata
    """
    logger.info("Starting code extraction from text")
    
    # Patterns for CPT, HCPCS, and PLA codes
    # CPT codes are 5 digits, sometimes with modifiers
    cpt_pattern = r'\b(\d{5})(?:-[A-Za-z0-9]{1,5})?\b'
    
    # HCPCS codes are alphanumeric, starting with letter
    hcpcs_pattern = r'\b([A-Z]\d{4})(?:-[A-Za-z0-9]{1,5})?\b'
    
    # PLA codes are 4 digits followed by U
    pla_pattern = r'\b(\d{4}U)(?:-[A-Za-z0-9]{1,5})?\b'
    
    # Find all matches
    cpt_matches = re.finditer(cpt_pattern, text)
    hcpcs_matches = re.finditer(hcpcs_pattern, text)
    pla_matches = re.finditer(pla_pattern, text)
    
    # Process CPT codes
    cpt_codes = []
    for match in cpt_matches:
        code = match.group(1)
        # Get context around the code for potential description
        start_pos = max(0, match.start() - 100)
        end_pos = min(len(text), match.end() + 100)
        context = text[start_pos:end_pos]
        
        cpt_codes.append({
            'code': code,
            'code_type': 'CPT',
            'payer_name': metadata['payer_name'],
            'year': metadata['year'],
            'line_of_business': metadata['line_of_business'],
            'source_file': metadata.get('source_file', 'Unknown')
        })
    
    # Process HCPCS codes
    hcpcs_codes = []
    for match in hcpcs_matches:
        code = match.group(1)
        # Get context around the code for potential description
        start_pos = max(0, match.start() - 100)
        end_pos = min(len(text), match.end() + 100)
        context = text[start_pos:end_pos]
        
        hcpcs_codes.append({
            'code': code,
            'code_type': 'HCPCS',
            'payer_name': metadata['payer_name'],
            'year': metadata['year'],
            'line_of_business': metadata['line_of_business'],
            'source_file': metadata.get('source_file', 'Unknown')
        })
    
    # Process PLA codes
    pla_codes = []
    for match in pla_matches:
        code = match.group(1)
        # Get context around the code for potential description
        start_pos = max(0, match.start() - 100)
        end_pos = min(len(text), match.end() + 100)
        context = text[start_pos:end_pos]
        
        pla_codes.append({
            'code': code,
            'code_type': 'PLA',
            'payer_name': metadata['payer_name'],
            'year': metadata['year'],
            'line_of_business': metadata['line_of_business'],
            'source_file': metadata.get('source_file', 'Unknown')
        })
    
    # Combine and deduplicate codes
    all_codes = []
    seen_codes = set()
    
    for code_dict in cpt_codes + hcpcs_codes + pla_codes:
        code_key = (code_dict['code'], code_dict['code_type'])
        if code_key not in seen_codes:
            all_codes.append(code_dict)
            seen_codes.add(code_key)
    
    logger.info(f"Extracted {len(all_codes)} unique codes from text")
    return all_codes

def process_pdf(file_content, metadata):
    """
    Process a PDF file to extract CPT, HCPCS, and PLA codes with metadata
    Args:
        file_content: PDF file content as bytes or BytesIO object
        metadata: Dictionary containing payer_name, year, line_of_business, and source_file
    Returns:
        list: List of dictionaries containing the extracted codes with metadata
    """
    logger.info(f"Processing PDF file: {metadata.get('source_file', 'Unknown')}")
    
    # Extract text from PDF
    text = extract_text_from_pdf(file_content)
    
    # Extract codes from text
    codes = extract_codes_from_text(text, metadata)
    
    logger.info(f"Finished processing PDF. Extracted {len(codes)} codes.")
    return codes