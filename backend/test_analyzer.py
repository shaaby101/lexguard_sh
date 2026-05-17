import asyncio
from analyzer import run_full_analysis

sample_contract = """
EMPLOYMENT AGREEMENT

1. Non-Compete: Employee agrees not to work for any competing business 
globally for 36 months after termination.

2. IP Assignment: All inventions, ideas, and work created during or 
outside working hours shall be the sole property of the Company.

3. Termination: Employee must provide 90 days written notice. 
Company may terminate with 2 days notice.

4. Arbitration: All disputes shall be resolved by binding arbitration 
in Delaware. Employee waives all rights to class action.
"""

persona = {
    "role": "employee",
    "concern": "I want to start my own company in 1 year"
}

result = asyncio.run(run_full_analysis(sample_contract, persona))

print("Overall score:", result["overall_score"])
print("Overall risk:", result["overall_risk"])
print("Clauses found:", result["clause_count"])
print("Critical:", result["critical_count"], "High:", result["high_count"])
print("\nFirst clause:", result["clauses"][0] if result["clauses"] else "None")
print("\nNegotiation email subject:", result["negotiation_email"]["subject"] if result["negotiation_email"] else "None")