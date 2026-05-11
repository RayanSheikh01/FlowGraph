# FlowGraph

A LangGraph agent that researches a topic, summarizes the findings, drafts an email, and sends it — with a React frontend that visualizes the graph in real time and lets a human approve, edit, or reject each step before it proceeds.

```
Research  →  Summarize  →  Draft Email  →  Send Email
        ↑           ↑              ↑
   [approve]   [approve]      [approve / edit]
```

## Stack

- **Backend** — FastAPI + LangGraph, Google Gemini (`gemini-2.5-flash-lite`), Tavily search, `smtplib` for sending.
- **Frontend** — Vite + React + TypeScript, React Flow for the canvas, Zustand for state.
- **Transport** — single WebSocket per session; HITL handled via LangGraph `interrupt()` + `Command(resume=...)`.

## Prerequisites

- Python 3.11+
- Node 20+
- [`uv`](https://github.com/astral-sh/uv) for the backend
- A Google API key (for Gemini), a Tavily API key, and SMTP credentials (Gmail App Password works)

## Setup

### Backend

```powershell
cd backend
uv sync
copy .env.example .env
# then edit .env with your keys
```

`.env` keys (see [backend/.env.example](backend/.env.example)):

```
GOOGLE_API_KEY=...
TAVILY_API_KEY=tvly-...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=you@gmail.com
SMTP_PASS=<app-password>
SMTP_FROM=you@gmail.com
```

### Frontend

```powershell
cd frontend
npm install
```

## Run

Two terminals:

```powershell
# terminal 1
cd backend
uv run uvicorn app.main:app --reload

# terminal 2
cd frontend
npm run dev
```

Open <http://localhost:5173>.

## End-to-end flow

1. Enter a topic and a recipient email, click **Run**.
2. The **Research** node turns blue (running), then green (complete). Its results appear in the HITL panel — click **Approve**.
3. **Summarize** runs; review and optionally edit the summary, then approve.
4. **Draft Email** runs; edit `to` / `subject` / `body` if needed, then approve.
5. **Send Email** runs; on success a banner shows `Email sent.` with the Message-ID, and the inbox you targeted receives the email.

Reject at any gate to terminate the flow with the reason recorded in state.

## Tests

```powershell
cd backend
uv run pytest
```

Tests run the full graph with mocked Gemini / Tavily / SMTP and assert each `interrupt` fires and each `Command(resume=...)` advances state correctly.

## Project layout

```
backend/
  app/
    main.py           # FastAPI + WS route
    graph.py          # LangGraph StateGraph
    nodes.py          # research / summarize / draft / send + gate nodes
    state.py          # FlowState TypedDict
    ws_manager.py     # WebSocket protocol
    config.py         # env loading (pydantic-settings)
  tests/
frontend/
  src/
    App.tsx
    components/
      GraphCanvas.tsx
      NodeCard.tsx
      HitlPanel.tsx
      StateInspector.tsx
    hooks/useGraphSocket.ts
    store.ts
    status.ts
    types.ts
```

## Out of scope

Multi-user auth, persistence beyond in-memory `MemorySaver`, retry/backoff, rate limiting, mobile layout.
