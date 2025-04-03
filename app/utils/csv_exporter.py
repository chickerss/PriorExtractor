import pandas as pd
import io
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def generate_csv_from_codes(codes):
    """
    Generate CSV content from extracted codes
    Args:
        codes: List of dictionaries containing extracted codes
    Returns:
        StringIO: CSV content as a StringIO object
    """
    logger.info(f"Generating CSV from {len(codes)} codes")
    
    try:
        # Create a DataFrame from the codes
        df = pd.DataFrame(codes)
        
        # Reorder columns for better readability
        column_order = [
            'code', 
            'code_type', 
            'payer_name', 
            'line_of_business', 
            'year', 
            'source_file'
        ]
        
        # Add any missing columns with empty values
        for col in column_order:
            if col not in df.columns:
                df[col] = ''
        
        # Select and order columns
        df = df[column_order]
        
        # Generate CSV to a string buffer
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        
        logger.info("CSV generation successful")
        return csv_buffer
    
    except Exception as e:
        logger.error(f"Error generating CSV: {str(e)}")
        raise Exception(f"Failed to generate CSV: {str(e)}")