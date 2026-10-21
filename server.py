"""
FastAPI Backend Server for ASEAN Visa AI Platform
Implements the streaming endpoint specified in design.md and ai_web_development_guide.md.

Run with:
    pip install fastapi uvicorn openai
    python server.py
"""

import os
import json
import asyncio
from typing import AsyncGenerator
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="ASEAN Visa AI Platform API",
    version="1.0.0",
    description="Asynchronous SSE Streaming & RAG Backend"
)

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    conversation_id: str = Field(default="conv-default", description="UUID of conversation session")
    message: str = Field(..., min_length=1, max_length=4000)
    stream: bool = Field(default=True)
    temperature: float = Field(default=0.2)

async def generate_chat_stream(prompt: str) -> AsyncGenerator[str, None]:
    """
    Streaming generator conforming to Server-Sent Events (SSE) protocol.
    Falls back to mock intelligent generation if OPENAI_API_KEY is not set.
    """
    api_key = os.getenv("OPENAI_API_KEY")

    if api_key:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=api_key)
            
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert AI immigration and visa advisory specialist representing ASEAN nations "
                            "(Thailand, Malaysia, Indonesia, Singapore, Vietnam, Philippines). "
                            "Provide concise, highly accurate, and legally grounded information."
                        )
                    },
                    {"role": "user", "content": prompt}
                ],
                stream=True,
                temperature=0.2
            )

            # Metadata header
            yield f'data: {{"type": "metadata", "model": "gpt-4o", "cache_hit": false}}\n\n'

            async for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    payload = json.dumps({"type": "token", "content": token})
                    yield f"data: {payload}\n\n"

            yield "data: [DONE]\n\n"
            return
        except Exception as exc:
            yield f'data: {{"type": "error", "message": "{str(exc)}"}}\n\n'
            yield "data: [DONE]\n\n"
            return

    # Fallback simulated streaming response if no API key is provided
    mock_response = (
        f"### ASEAN Immigration Advisory (Local Server Mock)\n\n"
        f"Regarding your query: *\"{prompt}\"*\n\n"
        f"1. **Thailand Destination Visa (DTV):** 5-year multiple entry, 180 days stay per entry, requires 500,000 THB in liquid funds.\n"
        f"2. **Malaysia DE Rantau Pass:** 12 to 24 months, requires $24,000 USD annual income.\n"
        f"3. **Indonesia Remote Worker (E33G):** 1-year renewable, requires $60,000 USD annual income.\n\n"
        f"> **Notice:** Set `OPENAI_API_KEY` in your environment to stream directly from live frontier models."
    )

    yield f'data: {{"type": "metadata", "model": "fastapi-local-engine", "cache_hit": false}}\n\n'
    
    words = mock_response.split(" ")
    for word in words:
        await asyncio.sleep(0.04)
        payload = json.dumps({"type": "token", "content": word + " "})
        yield f"data: {payload}\n\n"

    yield "data: [DONE]\n\n"

@app.post("/api/v1/chat/stream")
async def chat_stream_endpoint(request: ChatRequest):
    """
    Real-time SSE Chat Completion Stream (Matches design.md Section 7.1)
    """
    return StreamingResponse(
        generate_chat_stream(request.message),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "aseanvisa-ai-backend",
        "openai_configured": bool(os.getenv("OPENAI_API_KEY"))
    }

# Serve root static assets (index.html, styles.css, app.js)
@app.get("/")
async def serve_index():
    return FileResponse("index.html")

@app.get("/styles.css")
async def serve_styles():
    return FileResponse("styles.css")

@app.get("/app.js")
async def serve_app():
    return FileResponse("app.js")

if __name__ == "__main__":
    import uvicorn
    print("\nStarting ASEAN Visa AI Server on http://localhost:8000 ...")
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
