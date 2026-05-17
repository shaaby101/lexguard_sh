"""
LexGuard — FastAPI Backend
Main application entry point with CORS, health check, and /analyze endpoint stub.
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

app = FastAPI(
    title="LexGuard API",
    description="AI-powered contract risk analysis",
    version="0.1.0",
)

# --- CORS Configuration (touch_rules: CORS is King) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://*.run.app",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("[STARTUP] LexGuard FastAPI backend initialized")
print("[STARTUP] CORS configured for http://localhost:5173")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    print("[HEALTH] Health check requested")
    return {"status": "ok", "model": "gemini-2.5-flash"}


@app.post("/analyze")
async def analyze_contract(
    file: UploadFile = File(...),
    role: str = Form(...),
    concern: str = Form(...),
    counterparty_name: Optional[str] = Form("the counterparty"),
):
    """
    Analyze a contract PDF/TXT file.
    Stub — will be implemented in Phase 3.
    """
    print(f"[ANALYZE] Received file: {file.filename}, role: {role}, concern: {concern}")
    # Placeholder — will wire up parser + analyzer in Phase 3
    return {"message": "Endpoint stub — not yet implemented"}
