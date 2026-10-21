# ASEAN Visa AI Platform (`aseanvisa.com`)

A modern, production-grade AI web application interface written in pure **vanilla JavaScript, HTML5, and CSS3**.

This project implements the architecture, design specifications, and security guardrails defined in:
* [`ai_web_development_guide.md`](file:///c:/Users/Cho%20Lae%20Lae%20Yin/Downloads/aseanvisa.com/ai_web_development_guide.md)
* [`design.md`](file:///c:/Users/Cho%20Lae%20Lae%20Yin/Downloads/aseanvisa.com/design.md)

---

## 🌟 Implemented Architectural Features

1. **Server-Sent Events (SSE) Streaming (`Pattern 1`):**
   * Real-time chunk-by-chunk token rendering with smooth cursor typing animation and auto-scroll.
   * User stream cancellation (`AbortController`).
   * Live Raw SSE Protocol Inspector in the telemetry panel tracking `data: {"type": "token", ...}` and `data: [DONE]`.

2. **Vector Retrieval-Augmented Generation (RAG) (`Pattern 2`):**
   * Embedded vector knowledge base for Southeast Asian immigration acts (Thailand DTV/LTR, Malaysia DE Rantau/MM2H, Indonesia E33G, Singapore ONE Pass, Vietnam E-visa, Philippines SRRV).
   * Cosine similarity scoring ($S_{\text{sim}} \ge 0.70$) visualizer with candidate rank bars.
   * Interactive citation pills linking to verified legal regulations.
   * Collapsible Context Drawer displaying the dynamic system prompt with injected chunks.

3. **Redis Semantic Caching Simulator:**
   * In-memory cache testing vector similarity threshold ($\ge 0.96$).
   * Instant cache hit replay ($12\text{ms}$ TTFT, $\$0.0000$ token cost).

4. **Multi-LLM Circuit Breaker & Fallback:**
   * Live failover simulation between **OpenAI (GPT-4o)** $\rightarrow$ **Anthropic (Claude 3.5 Sonnet)** $\rightarrow$ **Google Gemini (1.5 Pro)**.
   * "Simulate 429 Error" trigger to demonstrate automated fallback.

5. **Security, Governance & Guardrails:**
   * Prompt isolation using `<user_untrusted_input>` boundary tags.
   * Sliding-window rate limiter display ($30\text{ RPM}$).
   * Zero client API key leakage.

6. **Interactive Document Ingestion:**
   * Modal dialog simulating 512-token chunking, embedding generation, and vector database upsert.

---

## 🚀 How to Run the Website

### Option 1: Direct in Browser (No installation required)
Simply double-click [`index.html`](file:///c:/Users/Cho%20Lae%20Lae%20Yin/Downloads/aseanvisa.com/index.html) or open it in any modern browser (Chrome, Edge, Firefox, Safari). The application operates out-of-the-box with a high-fidelity client simulation engine.

### Option 2: Using Python HTTP Server
```bash
# In the project directory:
python -m http.server 3000
```
Then navigate to: `http://localhost:3000`

### Option 3: Using the FastAPI Backend (`server.py`)
If you want to run the live asynchronous Python backend:
```bash
pip install fastapi uvicorn openai
# Optional: Set your OpenAI API key
# $env:OPENAI_API_KEY="sk-..."
python server.py
```
Open `http://localhost:8000` in your browser.
