from google import genai
import os
import json
import asyncio
import sys

if "GEMINI_API_KEY" not in os.environ:
    print("WARNING: GEMINI_API_KEY not set in environment.", file=sys.stderr)

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

def _generate_and_parse_json(prompt: str):
    """Helper to call Gemini, strip markdown, and parse JSON with 1 retry."""
    for attempt in range(2):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            text = response.text
            clean_text = text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            return json.loads(clean_text)
        except Exception as e:
            print(f"[ANALYZER] Error on attempt {attempt + 1}: {e}", file=sys.stderr)
            if attempt == 1:
                raise

def extract_clauses(contract_text: str, persona: dict) -> list[dict]:
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
    return _generate_and_parse_json(prompt)

def analyze_risks(clauses: list[dict], contract_text: str, persona: dict) -> list[dict]:
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
    risk_data = _generate_and_parse_json(prompt)
    
    # Merge risk analysis back into the clause list by matching id
    risk_dict = {item.get('id'): item for item in risk_data if 'id' in item}
    enriched_clauses = []
    for clause in clauses:
        enriched_clause = dict(clause)
        if clause.get('id') in risk_dict:
            enriched_clause.update(risk_dict[clause['id']])
        enriched_clauses.append(enriched_clause)
        
    return enriched_clauses

def generate_negotiation_email(clauses: list[dict], persona: dict, counterparty_name: str = "the other party") -> dict:
    high_critical_clauses = [c for c in clauses if c.get('severity') in ('critical', 'high')]
    
    if not high_critical_clauses:
        return None
        
    clause_summary = "\n".join([
        f"- CLAUSE: {c.get('title', 'Unknown')} — PROBLEM: {c.get('worst_case', '')} — BENCHMARK: {c.get('industry_benchmark', '')}"
        for c in high_critical_clauses
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
    return _generate_and_parse_json(prompt)

async def run_full_analysis(contract_text: str, persona: dict, counterparty_name: str = "the counterparty") -> dict:
    # 1. Call extract_clauses
    clauses = await asyncio.to_thread(extract_clauses, contract_text, persona)
    
    if not clauses:
        clauses = []

    # 2. Call analyze_risks
    if clauses:
        enriched_clauses = await asyncio.to_thread(analyze_risks, clauses, contract_text, persona)
    else:
        enriched_clauses = []

    # 3. Compute overall_score
    severity_weights = {
        "critical": 3,
        "high": 2,
        "medium": 1,
        "low": 0.5
    }
    
    total_score = 0
    total_weight = 0
    
    critical_count = 0
    high_count = 0
    medium_count = 0
    low_count = 0

    for clause in enriched_clauses:
        sev = clause.get("severity", "low").lower()
        score = clause.get("severity_score", 0)
        
        weight = severity_weights.get(sev, 0.5)
        total_score += score * weight
        total_weight += weight
        
        if sev == "critical":
            critical_count += 1
        elif sev == "high":
            high_count += 1
        elif sev == "medium":
            medium_count += 1
        else:
            low_count += 1

    overall_score = int(total_score / total_weight) if total_weight > 0 else 0
    overall_score = min(max(overall_score, 0), 100)
    
    if overall_score >= 80 or critical_count > 0:
        overall_risk = "critical"
    elif overall_score >= 50 or high_count > 0:
        overall_risk = "high"
    elif overall_score >= 25:
        overall_risk = "medium"
    else:
        overall_risk = "low"

    # 4. Call generate_negotiation_email
    negotiation_email = None
    if critical_count > 0 or high_count > 0:
        negotiation_email = await asyncio.to_thread(generate_negotiation_email, enriched_clauses, persona, counterparty_name)

    # 5. Return results
    return {
        "overall_score": overall_score,
        "overall_risk": overall_risk,
        "clause_count": len(enriched_clauses),
        "critical_count": critical_count,
        "high_count": high_count,
        "medium_count": medium_count,
        "low_count": low_count,
        "clauses": enriched_clauses,
        "negotiation_email": negotiation_email,
        "persona": persona
    }
