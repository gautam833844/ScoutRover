#!/usr/bin/env python3
"""
Simple HTTP server for RoverOS web app
Serves the rover_app folder on port 8000
Run this script on the Jetson with: python3 serve.py
"""

import http.server
import socketserver
import os
import sys

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        """Log messages with timestamp"""
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), format % args))

def start_server():
    """Start the HTTP server"""
    # Change to the directory containing this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    print(f"Starting RoverOS HTTP server...")
    print(f"Serving files from: {script_dir}")
    print(f"Server running at:")
    print(f"  - http://localhost:{PORT}")
    print(f"  - http://127.0.0.1:{PORT}")
    print(f"  - http://<your-jetson-ip>:{PORT}")
    print(f"\nPress Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped.")
        sys.exit(0)
    except OSError as e:
        print(f"Error: {e}")
        print(f"Port {PORT} might already be in use.")
        sys.exit(1)

if __name__ == "__main__":
    start_server()
