"""
Vercel serverless entry point for AgriConnect FastAPI backend.
SQLite is stored in /tmp (Vercel's ephemeral writable filesystem).
The DB is seeded automatically on cold start.
"""
import sys
import os

# Point to the backend source so all imports resolve
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Override the DB URL to use /tmp (only writable path in Vercel)
os.environ.setdefault('DATABASE_URL', 'sqlite:////tmp/agriconnect.db')

# Import the FastAPI app — this triggers init_db() + seed_database()
from main import app  # noqa: F401 — Vercel picks up the `app` object

# Vercel's Python runtime looks for an ASGI `app` export in api/index.py
__all__ = ['app']
