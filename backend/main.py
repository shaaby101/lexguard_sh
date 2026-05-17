from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import asyncio

import parser
from analyzer import run_full_analysis

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


MAX_FILE_SIZE = 10 * 1024 * 1024 # 10MB

@app.post("/analyze")
async def analyze_contract(
    file: UploadFile = File(...),
    role: str = Form(...),
    concern: str = Form(...),
    counterparty_name: Optional[str] = Form("the counterparty"),
):
    """
    Analyze a contract PDF/TXT file.
    """
    print(f"[ANALYZE] Received request. File: {file.filename}, Role: {role}")
    print(f"[ANALYZE] Concern: {concern}")
    print(f"[ANALYZE] Counterparty: {counterparty_name}")
    
    try:
        print("[ANALYZE] Reading file bytes...")
        file_bytes = await file.read()
        
        if len(file_bytes) > MAX_FILE_SIZE:
            print("[ANALYZE] Error: File exceeds 10MB limit")
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")
            
        print("[ANALYZE] Extracting text using parser...")
        contract_text = await asyncio.to_thread(parser.extract_text, file_bytes)
        print(f"[ANALYZE] Text extraction complete. Length: {len(contract_text)} chars")
        
        persona = {
            "role": role,
            "concern": concern
        }
        
        print("[ANALYZE] Starting 3-stage full analysis pipeline...")
        result = await run_full_analysis(contract_text, persona, counterparty_name)
        
        print("[ANALYZE] Pipeline complete. Returning results.")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ANALYZE] Error encountered: {str(e)}")
        return JSONResponse(status_code=422, content={"error": str(e)})
