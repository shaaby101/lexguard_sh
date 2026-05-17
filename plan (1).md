# LexGuard — AI Coding Agent Execution Plan
> Solo hackathon build · 7 hours · GCP deployment
> **Differentiator**: User-perspective adversarial analysis + negotiation email generator

---

## Architecture Overview

```
Frontend (React + Tailwind)
        ↓
FastAPI Backend (Cloud Run)
        ↓
Gemini 2.5 Flash (google-generativeai) — 3-stage chain
        ↓
PDF Parser (pdfplumber)
        ↓
GCP Cloud Storage (doc uploads)
```

**No RAG. No vector DB. No ChromaDB.** We win on product thinking, not pipeline complexity. Three well-crafted prompt chains beat a RAG setup you can't finish in time.

---

## Phase 0 — Scaffold (30 min)

### Agent Prompt
```
Create a monorepo project called "lexguard" with this structure:

lexguard/
  backend/
    main.py          # FastAPI app
    analyzer.py      # Claude API chain logic
    parser.py        # PDF text extraction
    requirements.txt
    Dockerfile
  frontend/
    src/
      App.jsx
      components/
        UploadZone.jsx
        PersonaSelector.jsx
        RiskDashboard.jsx
        ClauseCard.jsx
        NegotiationEmail.jsx
        LoadingState.jsx
    index.html
    package.json
    tailwind.config.js
    vite.config.js
  docker-compose.yml
  .env.example

Rules:
- Backend: FastAPI + pdfplumber + google-generativeai python SDK
- Frontend: React 18 + Vite + Tailwind CSS
- CORS configured for localhost:5173 and production domain
- Backend runs on port 8000
- Add a /health endpoint that returns {"status": "ok", "model": "gemini-2.5-flash"}
- requirements.txt must include: fastapi uvicorn pdfplumber google-generativeai python-multipart

Generate all files with correct boilerplate. Leave analyzer.py and parser.py empty for now with just import stubs.
```

---

## Phase 1 — PDF Parser (20 min)

### Agent Prompt
```
Implement parser.py for the LexGuard backend.

Requirements:
- Function: extract_text(file_bytes: bytes) -> str
- Use pdfplumber to extract text from PDF bytes
- Also support plain .txt files (detect by trying pdfplumber, fallback to raw decode)
- Clean the extracted text:
  - Remove excessive whitespace and blank lines (max 2 consecutive newlines)
  - Remove page headers/footers that repeat (heuristic: lines < 6 words appearing 3+ times)
  - Preserve clause structure and numbering
- If extraction fails or text < 100 chars, raise a ValueError with a clear message
- Return the cleaned full-text string

Keep it simple and robust. No OCR needed.
```

---

## Phase 2 — The 3-Stage Analysis Chain (90 min)
> This is the core differentiator. Take the most time here.

### Agent Prompt
```
Implement analyzer.py for LexGuard. This file contains the 3-stage Gemini analysis pipeline.

Use the google-generativeai Python SDK. Model: gemini-2.5-flash. 
API key from environment variable GEMINI_API_KEY.

SDK initialization at top of file:
  import google.generativeai as genai
  import os, json
  genai.configure(api_key=os.environ["GEMINI_API_KEY"])
  model = genai.GenerativeModel("gemini-2.5-flash")

For all calls use: response = model.generate_content(prompt)
Extract text via: response.text
Strip markdown fences before JSON parsing: text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()

---

STAGE 1 — Clause Extraction (structured JSON output)

Function: extract_clauses(contract_text: str, persona: dict) -> list[dict]

persona is: {"role": "employee|employer|buyer|vendor|tenant|landlord|freelancer|client", "concern": str (free text, e.g. "I want to leave this job in 6 months")}

Build a single prompt string (Gemini uses one combined prompt, not separate system/user):

prompt = f"""
You are a legal clause extraction engine. Extract all meaningful contractual clauses from the provided contract text.

For each clause, output a JSON object. Respond ONLY with a JSON array, no preamble, no markdown fences.

Each clause object must have:
- id: sequential integer
- title: short clause name (e.g. "Non-Compete", "Termination", "IP Assignment")
- category: one of ["non_compete", "termination", "ip_ownership", "liability", "arbitration", "data_privacy", "payment", "auto_renewal", "confidentiality", "indemnification", "governing_law", "other"]
- raw_text: the verbatim clause text (truncated to 300 chars if longer)
- parties_affected: which party bears the burden (e.g. "employee", "both", "employer")

USER CONTEXT:
- Role in this contract: {persona['role']}
- Specific concern: {persona['concern']}

CONTRACT TEXT:
{contract_text}

Extract all clauses. Focus especially on clauses that affect the {persona['role']} party.
Output ONLY the JSON array. No explanation, no markdown.
"""

Parse response.text as JSON. Return the list of clause dicts.

---

STAGE 2 — Adversarial Risk Analysis

Function: analyze_risks(clauses: list[dict], contract_text: str, persona: dict) -> list[dict]

Takes the clause list from Stage 1. For each clause, adds risk analysis from the user's perspective.

prompt = f"""
You are a legal advocate fighting EXCLUSIVELY for the user's interests. Your job is to find the worst realistic outcome of each clause for this specific user — not a neutral summary.

Be concrete: mention time periods, dollar amounts, geographic scope, rights lost. Do not hedge excessively.

Respond ONLY with a JSON array. Each object must have:
- id: matching the input clause id
- severity: "critical" | "high" | "medium" | "low"
- severity_score: integer 0-100
- worst_case: 1-2 sentences describing the worst realistic outcome for THIS user if this clause is enforced as written
- is_unusual: boolean — true if this clause is broader/harsher than typical industry standard
- industry_benchmark: one sentence comparing to what's standard (e.g. "Most employment contracts limit non-competes to 12 months; this one is 36 months.")
- negotiable: boolean — is this clause typically negotiable?

USER ROLE: {persona['role']}
USER CONCERN: {persona['concern']}

CLAUSES TO ANALYZE:
{json.dumps(clauses, indent=2)}

FULL CONTRACT CONTEXT (first 3000 chars):
{contract_text[:3000]}

For each clause, analyze the worst-case impact specifically on a {persona['role']}. Flag any clause broader than industry standard.
Output ONLY the JSON array. No explanation, no markdown.
"""

Merge the risk analysis back into the clause list (by matching id). Return enriched clause list.

---

STAGE 3 — Negotiation Email Generator

Function: generate_negotiation_email(clauses: list[dict], persona: dict, counterparty_name: str = "the other party") -> dict

Takes only clauses where severity is "critical" or "high". Generates a professional pushback email.

Format the high/critical clauses as a list:
  clause_summary = "\n".join([
    f"- CLAUSE: {c['title']} — PROBLEM: {c['worst_case']} — BENCHMARK: {c['industry_benchmark']}"
    for c in clauses if c.get('severity') in ('critical', 'high')
  ])

prompt = f"""
You are a professional negotiator drafting an email on behalf of the user. The email must:
- Be professional and non-confrontational
- Reference specific clauses by name
- Propose specific alternative language for each flagged clause
- Be concise (under 350 words)
- Not sound like it was written by AI

I am a {persona['role']} reviewing a contract. The following clauses concern me:

{clause_summary}

Draft a professional email to {counterparty_name} requesting specific changes to these clauses. Propose concrete alternative language for each.

Respond with ONLY a JSON object (no markdown fences):
{{
  "subject": "email subject line",
  "body": "full email body with proposed redlines",
  "key_asks": ["ask 1", "ask 2", "ask 3"]
}}
"""

Parse and return the JSON object.

---

ORCHESTRATOR FUNCTION:

async def run_full_analysis(contract_text: str, persona: dict, counterparty_name: str = "the counterparty") -> dict:
  1. Call extract_clauses → clause list
  2. Call analyze_risks → enriched clause list
  3. Compute overall_score: weighted average of severity_scores (critical=weight 3, high=weight 2, medium=weight 1, low=weight 0.5)
  4. Call generate_negotiation_email (only if any critical/high clauses exist)
  5. Return:
  {
    "overall_score": int,
    "overall_risk": "critical|high|medium|low",
    "clause_count": int,
    "critical_count": int,
    "high_count": int,
    "medium_count": int,
    "low_count": int,
    "clauses": [...enriched clause list...],
    "negotiation_email": {...} or null,
    "persona": persona
  }

Use asyncio.to_thread() to wrap all synchronous Gemini SDK calls.
Handle all JSON parse errors with a retry (1 retry, same prompt). Log errors to stderr.
```

---

## Phase 3 — FastAPI Backend (30 min)

### Agent Prompt
```
Implement main.py for LexGuard FastAPI backend.

Endpoints:

POST /analyze
- Accepts multipart/form-data with fields:
  - file: UploadFile (PDF or TXT)
  - role: str (employee|employer|buyer|vendor|tenant|landlord|freelancer|client)
  - concern: str (free text, user's specific concern, max 200 chars)
  - counterparty_name: str (optional, default "the counterparty")
- Extracts text via parser.extract_text()
- Runs analyzer.run_full_analysis()
- Returns the full analysis JSON
- On error: return {"error": str(e)} with status 422

GET /health
- Returns {"status": "ok", "model": "claude-sonnet-4-20250514"}

CORS:
- Allow origins: ["http://localhost:5173", "https://*.run.app", "*"]
- Allow all methods and headers

Add a 10MB file size limit check before processing. Reject with 413 if exceeded.

Use async def for the /analyze endpoint. Use asyncio.to_thread() to wrap the synchronous Claude calls.
```

---

## Phase 4 — Frontend Core (60 min)

### Agent Prompt
```
Build the LexGuard React frontend. Stack: React 18 + Vite + Tailwind CSS.

Design direction: Dark legal-tech aesthetic. Deep navy/charcoal background (#0f1117). 
Clean white text. Risk colors: red (#ef4444) for critical, orange (#f97316) for high, 
yellow (#eab308) for medium, green (#22c55e) for low.
Font: use "IBM Plex Mono" for headings (import from Google Fonts) and system-sans for body.
Feel: authoritative, serious, like a tool a lawyer would use. No gradients. No rounded-everything.

---

App.jsx — Main state machine with 3 views: UPLOAD, LOADING, RESULTS

State:
- view: "upload" | "loading" | "results"  
- analysisResult: null | {...}
- error: null | string

---

UploadZone.jsx

Props: onSubmit(formData)

UI:
- Drag-and-drop zone for PDF/TXT upload
- Role selector: dropdown with options [employee, employer, buyer, vendor, tenant, landlord, freelancer, client]
- Concern textarea: "What's your specific concern? (e.g. I want to start a competing business in 1 year)" — max 200 chars with live counter
- Counterparty name input: "Who sent you this contract?" (optional)
- "Analyze Contract" button — disabled until file + role selected
- Show filename when file is selected
- Subtle file size warning if > 10MB

---

LoadingState.jsx

A fullscreen loading view with 3 animated steps that progress with delays:
- Step 1 (0s): "Extracting clauses..." 
- Step 2 (3s): "Analyzing risks from your perspective..."
- Step 3 (6s): "Drafting negotiation strategy..."
Each step fades in. Use CSS animations only.

---

RiskDashboard.jsx

Props: result (the full analysis object)

Top section:
- Overall risk score displayed as a large number (0-100) with color coding
- 4 count badges: Critical / High / Medium / Low with counts
- Risk distribution bar (proportional colored segments)
- Persona context: "Analyzing as: {role} · Concern: {concern}"

Clause list section:
- Sort clauses by severity_score descending
- Render each clause as a ClauseCard

---

ClauseCard.jsx

Props: clause

Show:
- Severity badge (color-coded pill)
- Clause title and category
- Worst case scenario in a highlighted box (red-tinted background for critical/high)
- Industry benchmark in a dimmer style (italic, gray)
- "Unusual clause" badge if is_unusual is true
- Raw text in a collapsed <details> element ("View original clause text")
- "Negotiable" indicator

---

NegotiationEmail.jsx

Props: email (the negotiation_email object)

Show:
- Section header: "Your Negotiation Email" with a copy-all button
- Subject line in a copyable input field
- Email body in a <pre>-style box with monospace font, copyable
- Key asks as a numbered list
- Disclaimer in small text: "This is AI-generated. Review with a legal professional before sending."

---

Wire everything together in App.jsx:
- Upload view → call POST /analyze → loading view → results view
- Results view shows RiskDashboard + NegotiationEmail (if present)
- Error banner if API returns error
- "Analyze another contract" button resets to upload view

Backend URL: import.meta.env.VITE_API_URL || "http://localhost:8000"
```

---

## Phase 5 — Polish & Demo Prep (30 min)

### Agent Prompt
```
Polish the LexGuard frontend and add final touches:

1. Add a top navbar with:
   - "LexGuard" logo text in IBM Plex Mono
   - Tagline: "Know what you're signing"
   - No auth, no links — just branding

2. Add a footer with:
   - "Not legal advice. For informational purposes only."
   - In small, muted text

3. Add smooth fade-in animation when results load (CSS transition, opacity 0→1 over 400ms)

4. On ClauseCard, add a subtle left border color matching severity 
   (critical=red, high=orange, medium=yellow, low=green)

5. Make the overall risk score pulse with a CSS animation if severity is "critical"

6. Add a sample contract banner on the upload page:
   - "No contract handy? Try our sample →" 
   - Clicking it fetches /sample-contract endpoint and auto-fills the form
   - Add GET /sample-contract to the FastAPI backend that returns a plaintext employment 
     contract with 3-4 intentionally harsh clauses (non-compete 3 years, IP assignment 
     for all personal projects, mandatory arbitration, unlimited liability) as {"text": "..."}
   - This is critical for demo — never demo with a blank slate

7. Ensure all copy buttons use the Clipboard API with a "Copied!" toast feedback (2 sec)

8. Mobile-responsive: stack cards vertically on screens < 768px
```

---

## Phase 6 — GCP Deployment (30 min)

### Agent Prompt
```
Create GCP Cloud Run deployment configuration for LexGuard.

Files to create:

1. backend/Dockerfile:
- Base image: python:3.11-slim
- Install requirements.txt
- Copy app files
- CMD: uvicorn main:app --host 0.0.0.0 --port 8080
- Expose port 8080

2. frontend/Dockerfile:
- Multi-stage: node:18-alpine to build, nginx:alpine to serve
- Build: npm ci && npm run build
- Serve: copy dist/ to nginx html dir
- Add nginx.conf that proxies /api/* to backend service URL (use ARG VITE_API_URL)
- Expose port 80

3. deploy.sh (executable shell script):
#!/bin/bash
# Usage: ./deploy.sh YOUR_GCP_PROJECT_ID

PROJECT_ID=$1
REGION="us-central1"
BACKEND_SERVICE="lexguard-backend"
FRONTEND_SERVICE="lexguard-frontend"

# Build and push backend
gcloud builds submit ./backend --tag gcr.io/$PROJECT_ID/$BACKEND_SERVICE
gcloud run deploy $BACKEND_SERVICE \
  --image gcr.io/$PROJECT_ID/$BACKEND_SERVICE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=$GEMINI_API_KEY \
  --memory 512Mi \
  --timeout 120

# Get backend URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region $REGION --format 'value(status.url)')

# Build and push frontend  
gcloud builds submit ./frontend \
  --tag gcr.io/$PROJECT_ID/$FRONTEND_SERVICE \
  --build-arg VITE_API_URL=$BACKEND_URL
gcloud run deploy $FRONTEND_SERVICE \
  --image gcr.io/$PROJECT_ID/$FRONTEND_SERVICE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 256Mi

echo "Frontend URL:"
gcloud run services describe $FRONTEND_SERVICE --region $REGION --format 'value(status.url)'

4. .env.example:
GEMINI_API_KEY=AIza...
VITE_API_URL=http://localhost:8000

5. README.md with:
- One-line description
- Local dev setup (docker-compose up)
- GCP deploy instructions (./deploy.sh PROJECT_ID)
- Architecture diagram in ASCII
```

---

## Phase 7 — Pre-Demo Checklist (remaining time)

### Agent Prompt
```
Create three demo contract text files in a demo/ folder:

1. demo/harsh_employment.txt
A 400-word employment contract with these intentional red flags:
- 36-month non-compete covering "any related industry globally"  
- IP assignment clause covering "all inventions created during or outside working hours"
- Mandatory binding arbitration in Delaware, waiving class action rights
- 90-day notice period required from employee (vs 2 weeks from employer)
- Automatic 1-year renewal with no opt-out window
Write it in realistic legal language. Make it sound like a real contract.

2. demo/vendor_agreement.txt
A 350-word vendor agreement with:
- Uncapped liability for the vendor
- Unlimited data usage rights for the client
- Unilateral termination by client with 0 days notice
- Auto-renewal with 6-month cancellation window
- Payment terms: net-90 (vendor waits 90 days)

3. demo/reasonable_nda.txt
A 300-word NDA that is mostly fair:
- 2-year confidentiality period (standard)
- Mutual obligations (both parties)
- Standard carve-outs for public information
- One mild concern: definition of "confidential information" is overly broad
This tests that the system doesn't over-flag everything — credibility matters.

These three contracts should be used in the demo to show:
1. The system catches critical issues (harsh_employment)
2. It works for vendor contexts (vendor_agreement)  
3. It doesn't cry wolf on reasonable contracts (nda)
```

---

## Execution Timeline

| Hour | Phase | Goal |
|------|-------|------|
| 0:00–0:30 | Phase 0 | Project scaffold running |
| 0:30–0:50 | Phase 1 | PDF parsing working |
| 0:50–2:20 | Phase 2 | 3-stage Gemini chain complete |
| 2:20–2:50 | Phase 3 | FastAPI endpoints live |
| 2:50–3:50 | Phase 4 | Frontend core built |
| 3:50–4:20 | Phase 5 | Polish + sample contract |
| 4:20–4:50 | Phase 6 | GCP deployed |
| 4:50–5:00 | Phase 7 | Demo contracts ready |
| 5:00–7:00 | Buffer | Fix bugs, rehearse pitch |

---

## Pitch Script (60 seconds)

> "You got a job offer. You're excited. You sign. 18 months later you want to go freelance — and you can't, for 3 years, across all of Asia, including side projects you built on weekends. That's a real clause we just found in this contract."
>
> [demo the tool]
>
> "Most tools tell you what a contract says. LexGuard tells you what it does to **you** — and gives you the exact email to send back."

---

## Key Differentiators to Mention to Judges

1. **Persona-aware analysis** — same clause, different risk for employer vs employee
2. **Adversarial framing** — we fight for the user, not neutral summarization  
3. **Industry benchmarking** — "36 months is 3x the typical non-compete"
4. **Negotiation email** — actionable output, not just a report
5. **Credibility** — fair contracts score low; we don't over-flag

---

*Built for Promptwars Hackathon · LexGuard · Not legal advice*
