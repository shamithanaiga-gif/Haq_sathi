"""
Haq Saathi - Server Entry Point
Runs the FastAPI web application on http://localhost:8000
"""
import sys
import os

# Ensure UTF-8 output encoding on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"==================================================")
    print(f"  🏛️  Haq Saathi - ಹಕ್ಕು ಸಾಥಿ (Voice-First Navigator)")
    print(f"  Listening on: http://127.0.0.1:{port}")
    print(f"==================================================")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=port, reload=False)
