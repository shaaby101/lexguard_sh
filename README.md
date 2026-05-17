# LexGuard: Know What You're Signing

LexGuard is an adversarial legal-tech platform that extracts and analyzes contractual clauses using Groq (Llama-3.3-70b-versatile). It provides a risk dashboard and drafts a negotiation email for flagged terms.

## Local Development

Start both services locally using your preferred terminal:

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --env-file ../.env
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## GCP Deployment

Deploy to Google Cloud Run using the provided bash script.

```bash
# Export your API key
export GROQ_API_KEY=gsk_your_key_here

# Run the deployment script
./deploy.sh YOUR_GCP_PROJECT_ID
```

## Architecture

```text
+-------------------+       +-----------------------+       +-------------------+
|                   |       |                       |       |                   |
|  React Frontend   +------>+  FastAPI Backend      +------>+  Groq API         |
|  (Vite + Tailwind)|  REST |  (PDF Parsing + Validation)  |  (Llama-3.3-70b)   |
|                   |       |                       |       |                   |
+-------------------+       +-----------------------+       +-------------------+
```
