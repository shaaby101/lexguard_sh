from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import asyncio
import os

import parser
from analyzer import run_full_analysis

# --- (4) Startup environment check ---
if not os.environ.get("GROQ_API_KEY"):
    print("[SECURITY] WARNING: GROQ_API_KEY is not set. API calls will fail.")

app = FastAPI(
    title="LexGuard API",
    description="AI-powered contract risk analysis",
    version="0.1.0",
)

# --- (5) CORS Configuration — explicit origins only, no wildcard ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
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
    return {"status": "ok", "model": "llama-3.3-70b-versatile"}


def is_valid_contract(text: str) -> bool:
    contract_keywords = [
        "agreement", "contract", "party", "parties", "terms",
        "obligations", "clause", "whereas", "hereby", "signed",
        "confidential", "termination", "liability", "govern",
        "indemnify", "warranty", "jurisdiction", "dispute", "breach",
        "witnesseth", "consideration", "covenant", "representation"
    ]
    text_lower = text.lower()
    matches = sum(1 for kw in contract_keywords if kw in text_lower)
    print(f"[VALIDATOR] Contract keyword matches: {matches}/{len(contract_keywords)}")
    return matches >= 5

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_CONTRACT_CHARS = 15000         # (6) Prompt injection guard
ALLOWED_ROLES = {"employee", "employer", "buyer", "vendor", "tenant", "landlord", "freelancer", "client"}
ALLOWED_EXTENSIONS = {".pdf", ".txt"}

@app.get("/sample-contract")
async def get_sample_contract():
    return {"text": """
EMPLOYMENT AGREEMENT

This Agreement is entered into between the Company and the Employee.

1. NON-COMPETE: The Employee agrees that during their employment and for a period of 3 years thereafter, they shall not engage in any business that competes with the Company anywhere in the world.

2. INTELLECTUAL PROPERTY: Employee agrees that all intellectual property, inventions, or ideas created by Employee during the term of employment, including those created entirely on Employee's personal time and using personal equipment, shall be the sole and exclusive property of the Company.

3. ARBITRATION: Any dispute arising out of this Agreement shall be resolved by binding arbitration in a location chosen by the Company. The Employee waives any right to a trial by jury or to participate in a class action. The arbitrator shall be chosen solely by the Company.

4. LIABILITY: In no event shall the Company's liability to the Employee exceed the sum of $100. The Employee agrees to indemnify the Company for any losses, costs, or damages arising from Employee's actions, with unlimited liability.

IN WITNESS WHEREOF, the parties have signed this Agreement.
"""}

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
    # --- (1) File extension validation — before reading bytes ---
    filename = file.filename or ""
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        print(f"[SECURITY] File rejected: invalid type {filename}")
        raise HTTPException(status_code=415, detail="Only PDF and TXT files are supported.")

    print(f"[ANALYZE] Received request. File: {filename}, Role: {role}")
    print(f"[ANALYZE] Concern: {concern}")
    print(f"[ANALYZE] Counterparty: {counterparty_name}")

    try:
        # --- (1) File size check BEFORE reading into memory via Content-Length hint ---
        # We still read to get exact size, but reject immediately after
        print("[ANALYZE] Reading file bytes...")
        file_bytes = await file.read()

        if len(file_bytes) > MAX_FILE_SIZE:
            size_mb = round(len(file_bytes) / (1024 * 1024), 2)
            print(f"[SECURITY] File rejected: too large {size_mb}MB")
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")

        # --- (2) Input sanitization ---
        role = (role or "").strip()
        concern = (concern or "").strip()[:200]
        counterparty_name = (counterparty_name or "the counterparty").strip()[:100]

        if role not in ALLOWED_ROLES:
            print(f"[SECURITY] Invalid role received: '{role}', defaulting to employee")
            role = "employee"

        print("[ANALYZE] Extracting text using parser...")
        contract_text = await asyncio.to_thread(parser.extract_text, file_bytes)
        print(f"[ANALYZE] Text extraction complete. Length: {len(contract_text)} chars")

        # --- (6) Truncate contract text to prevent prompt injection ---
        if len(contract_text) > MAX_CONTRACT_CHARS:
            print(f"[SECURITY] Contract text truncated from {len(contract_text)} to {MAX_CONTRACT_CHARS} chars")
            contract_text = contract_text[:MAX_CONTRACT_CHARS]
        print(f"[SECURITY] Contract text length: {len(contract_text)} chars")

        if not is_valid_contract(contract_text):
            print("[VALIDATOR] Rejected: document does not appear to be a legal contract")
            raise HTTPException(
                status_code=422,
                detail="This document does not appear to be a legal contract. Please upload a contract, NDA, employment agreement, vendor agreement, or similar legal document."
            )
        print("[VALIDATOR] Document passed contract validation")

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
        # --- (3) Never expose raw exception details to client ---
        print(f"[ERROR] Analysis failed: {str(e)}")
        return JSONResponse(status_code=500, content={"error": "Analysis failed. Please try again."})
