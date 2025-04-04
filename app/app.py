from flask import Flask, render_template, request, jsonify, send_file
import os
from werkzeug.utils import secure_filename
from app.utils.pdf_processor import process_pdf
from app.utils.csv_exporter import generate_csv_from_codes
from app.utils.azure_uploader import upload_to_azure_databricks
from app.utils.storage import storage
import json
from io import BytesIO

# Initialize Flask app
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB max file size
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tmp')

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/api/codes', methods=['GET'])
def get_codes():
    """Get all extracted codes"""
    return jsonify(storage.get_all_codes())

@app.route('/api/codes/search', methods=['GET'])
def search_codes():
    """Search extracted codes"""
    search_term = request.args.get('term', '')
    return jsonify(storage.search_codes(search_term))

@app.route('/api/payers', methods=['GET'])
def get_payers():
    """Get unique payer names"""
    all_codes = storage.get_all_codes()
    unique_payers = list(set(code['payer_name'] for code in all_codes))
    return jsonify(unique_payers)

@app.route('/api/lines-of-business', methods=['GET'])
def get_lines_of_business():
    """Get unique lines of business"""
    all_codes = storage.get_all_codes()
    unique_lobs = list(set(code['line_of_business'] for code in all_codes))
    return jsonify(unique_lobs)

@app.route('/api/process-pdf', methods=['POST'])
def process_pdf_endpoint():
    """Process a PDF file to extract codes"""
    # Check if file was uploaded
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    # Check if file is empty
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Check if file is a PDF
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are allowed'}), 400
    
    # Get metadata from request
    payer_name = request.form.get('payer_name', '')
    year = int(request.form.get('year', 2023))
    line_of_business = request.form.get('line_of_business', '')
    
    # Check if metadata is provided
    if not payer_name or not line_of_business:
        return jsonify({'error': 'Metadata (payer name and line of business) is required'}), 400
    
    try:
        # Prepare metadata
        metadata = {
            'payer_name': payer_name,
            'year': year,
            'line_of_business': line_of_business,
            'source_file': secure_filename(file.filename)
        }
        
        # Process PDF and extract codes
        file_content = file.read()
        extracted_codes = process_pdf(file_content, metadata)
        
        # Save extracted codes
        saved_codes = storage.save_codes(extracted_codes)
        
        return jsonify({
            'message': f'Successfully processed {file.filename}',
            'extracted_codes': saved_codes
        })
    
    except Exception as e:
        return jsonify({'error': f'Error processing PDF: {str(e)}'}), 500

@app.route('/api/codes', methods=['POST'])
def save_codes():
    """Save extracted codes"""
    try:
        codes_to_save = request.json
        
        if not codes_to_save:
            return jsonify({'error': 'No codes provided'}), 400
        
        saved_codes = storage.save_codes(codes_to_save)
        
        return jsonify({
            'message': f'Successfully saved {len(saved_codes)} codes',
            'saved_codes': saved_codes
        })
    
    except Exception as e:
        return jsonify({'error': f'Error saving codes: {str(e)}'}), 500

@app.route('/api/export-csv', methods=['GET'])
def export_csv():
    """Export extracted codes as CSV"""
    try:
        all_codes = storage.get_all_codes()
        
        if not all_codes:
            return jsonify({'error': 'No codes to export'}), 400
        
        csv_buffer = generate_csv_from_codes(all_codes)
        
        return send_file(
            BytesIO(csv_buffer.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name='extracted_codes.csv'
        )
    
    except Exception as e:
        return jsonify({'error': f'Error exporting CSV: {str(e)}'}), 500

@app.route('/api/upload-to-azure', methods=['POST'])
def upload_to_azure():
    """Upload extracted codes to Azure Databricks"""
    try:
        connection = request.json
        
        if not connection or not all(k in connection for k in ['workspace_url', 'access_token', 'directory_path']):
            return jsonify({'error': 'Invalid Azure connection details'}), 400
        
        all_codes = storage.get_all_codes()
        
        if not all_codes:
            return jsonify({'error': 'No codes to upload'}), 400
        
        result = upload_to_azure_databricks(all_codes, connection)
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': f'Error uploading to Azure: {str(e)}'}), 500

@app.route('/api/codes', methods=['DELETE'])
def clear_codes():
    """Clear all extracted codes"""
    try:
        storage.clear_all_codes()
        return jsonify({'message': 'All codes cleared successfully'})
    
    except Exception as e:
        return jsonify({'error': f'Error clearing codes: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8501, debug=True)
