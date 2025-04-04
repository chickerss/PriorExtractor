import os
import sys

# Add app directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Check for application type argument
if len(sys.argv) > 1 and sys.argv[1] == 'streamlit':
    # Run streamlit app
    import streamlit.web.cli as stcli
    from pathlib import Path

    streamlit_file = Path(__file__).parent / "streamlit_app.py"

    sys.argv = ["streamlit", "run", str(streamlit_file), "--server.port=8501", "--server.address=0.0.0.0"]
    sys.exit(stcli.main())
else:
    # Run Flask app
    from app.app import app
    
    # Start the Flask application
    if __name__ == '__main__':
        app.run(host='0.0.0.0', port=5001, debug=True)
