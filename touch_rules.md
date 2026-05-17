# LexGuard Development Rules
**Context:** This is a 7-hour solo hackathon sprint. Speed, stability, and a working demo are prioritized over perfect code architecture. 

## Part 1: Strict Directives for the AI Coding Agent

1. **No Unprompted Refactoring:** Never rewrite a working component or function unless explicitly asked. If fixing a bug, change *only* the lines causing the bug. 
2. **Defensive LLM Parsing:** The Gemini 2.5 Flash model will occasionally wrap JSON in markdown blocks (e.g., ` ```json `). Always write defensive parsing logic (e.g., `strip()`, `replace()`, or regex) before calling `json.loads()`. Wrap all LLM calls in `try/except` blocks that log the exact raw output if parsing fails.
3. **Verbose Debugging:** * **Backend:** Add `print()` statements for every major step in FastAPI (e.g., "Extracting text...", "Stage 1 complete", "Error in JSON parse").
    * **Frontend:** Add `console.log()` for all API responses and state changes. We need to see exactly where data drops.
4. **CORS is King:** When setting up FastAPI, explicitly configure `CORSMiddleware` to allow `http://localhost:5173`. Do not skip this.
5. **Keep UI Simple:** Use standard Tailwind utility classes. Do not introduce complex CSS grids, external component libraries (like MUI or Radix), or complex animation libraries (like Framer Motion) unless explicitly requested. 
6. **Stop After 2 Attempts:** If the human provides an error log, and your first fix fails, and your second fix fails: **STOP**. Do not blindly suggest a third fix. Ask the human to verify a specific variable or test a specific endpoint manually. Prevent the hallucination loop.

## Part 2: The "Anti-Loop" Protocol (For the Human & AI)

If a bug takes more than 15 minutes to fix, initiate the Anti-Loop Protocol:
1. **Isolate:** Stop testing via the React UI. If it's a backend issue, test via `curl` or Postman. If it's a frontend issue, hardcode dummy JSON data into the React component to bypass the backend.
2. **Revert:** Use `git checkout` to go back to the last working state. (Human: You must commit after every successful phase!).
3. **Pivots over Perfection:** If a specific feature is causing the loop (e.g., the streaming text animation won't work), scrap it. A static text box that works is better than a broken animation that crashes the app.

## Part 3: Human Developer Manifesto

1. **Backend First:** Do not let the AI write `App.jsx` until you have manually uploaded a PDF to `http://localhost:8000/analyze` via Postman/Swagger and received the perfect JSON response.
2. **Commit Obsessively:** Run `git add . && git commit -m "Phase X working"` the second a feature turns green. This is your undo button when the AI breaks everything.
3. **Ugly but Functional Wins:** If the React dashboard is slightly misaligned but the AI logic works, **move on**. Judges care about the Adversarial Risk logic and the Negotiation Email. They will forgive a slightly off-center button.
4. **The Streamlit Escape Hatch:** If at Hour 4 the React-to-FastAPI connection is completely broken and unfixable, abandon the frontend folder. Port `analyzer.py` into a single `app.py` Streamlit file. You can build a working Streamlit UI in 30 minutes.