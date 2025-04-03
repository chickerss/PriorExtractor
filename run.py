import os
import sys
import subprocess

def run_flask_app():
    """Run the Flask application"""
    print("Starting Flask application on port 5001...")
    from app.app import app
    app.run(host='0.0.0.0', port=5001, debug=True)

def run_streamlit_app():
    """Run the Streamlit application"""
    print("Starting Streamlit application on port 8501...")
    subprocess.run(["streamlit", "run", "app/streamlit_app.py", 
                   "--server.port=8501", "--server.address=0.0.0.0"])

if __name__ == "__main__":
    # Check command-line arguments
    if len(sys.argv) > 1:
        if sys.argv[1].lower() == "flask":
            run_flask_app()
        elif sys.argv[1].lower() == "streamlit":
            run_streamlit_app()
        else:
            print(f"Unknown argument: {sys.argv[1]}")
            print("Usage: python run.py [flask|streamlit]")
    else:
        # Default to Flask app
        run_flask_app()