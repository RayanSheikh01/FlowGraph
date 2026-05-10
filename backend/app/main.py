from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.runnables import RunnableConfig
from langgraph.types import Command
from pydantic import ValidationError

from .config import settings
from .graph import compiled_graph
from .ws_manager import (
    DoneMsg,
    ErrorMsg,
    InterruptMsg,
    ResumeMsg,
    StartMsg,
    StateUpdateMsg,
    decode_decision,
    safe_send,
)

app = FastAPI(title=settings.app_name)
app.debug = settings.debug

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.websocket("/ws/{thread_id}")
async def ws_endpoint(ws: WebSocket, thread_id: str):
    await ws.accept()
    config: RunnableConfig = {"configurable": {"thread_id": thread_id}}

    try:
        raw = await ws.receive_text()
        start = StartMsg.model_validate_json(raw)
    except (WebSocketDisconnect, ValidationError) as e:
        await safe_send(ws, ErrorMsg(message=f"invalid start message: {e}"))
        await ws.close()
        return

    initial_state = {
        "topic": start.topic,
        "recipient_email": start.recipient_email,
        "research_results": [],
        "summary": "",
        "email_draft": {},
        "email_sent": False,
        "node_status": {},
        "error": None,
    }

    try:
        await _drive_graph(ws, initial_state, config)
    except WebSocketDisconnect:
        return
    except Exception as e:
        await safe_send(ws, ErrorMsg(message=str(e)))
        try:
            await ws.close()
        except Exception:
            pass


async def _drive_graph(ws: WebSocket, payload, config: RunnableConfig):
    while True:
        async for event in compiled_graph.astream(payload, config, stream_mode="values"):
            if not await safe_send(ws, StateUpdateMsg(state=_serializable(event))):
                return

        snap = compiled_graph.get_state(config)
        pending_interrupts = [
            i for task in snap.tasks for i in task.interrupts
        ]
        if not pending_interrupts:
            await safe_send(ws, DoneMsg(state=_serializable(snap.values)))
            await ws.close()
            return

        intr = pending_interrupts[0].value or {}
        await safe_send(
            ws,
            InterruptMsg(
                step=intr.get("step", "unknown"),
                message=intr.get("message", ""),
                preview=intr.get("preview"),
            ),
        )

        raw = await ws.receive_text()
        try:
            resume = ResumeMsg.model_validate_json(raw)
        except ValidationError as e:
            await safe_send(ws, ErrorMsg(message=f"invalid resume message: {e}"))
            await ws.close()
            return

        payload = Command(resume=decode_decision(resume))


def _serializable(state) -> dict:
    """Coerce graph state values into something Pydantic/JSON-safe."""
    if state is None:
        return {}
    if isinstance(state, dict):
        return state
    return dict(state)
