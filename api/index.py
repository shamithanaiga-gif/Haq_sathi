"""
Haq Saathi - Vercel Serverless Function Entrypoint
Exposes the FastAPI ASGI application for native Vercel serverless execution.
"""
import sys
import os

# Ensure the root project directory is on sys.path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.main import app

# Vercel serverless handler uses 'app' as the ASGI application callable
