from typing import Any, Literal

from fastapi import WebSocket
from pydantic import BaseModel


class StartMsg(BaseModel):
    type: Literal["start"]
    topic: str
    recipient_email: str


class ResumeMsg(BaseModel):
    type: Literal["resume"]
    decision: Literal["approve", "reject", "edit"]
    patch: dict[str, Any] | None = None


class StateUpdateMsg(BaseModel):
    type: Literal["state_update"] = "state_update"
    state: dict[str, Any]


class InterruptMsg(BaseModel):
    type: Literal["interrupt"] = "interrupt"
    step: str
    message: str = ""
    preview: Any = None


class DoneMsg(BaseModel):
    type: Literal["done"] = "done"
    state: dict[str, Any]


class ErrorMsg(BaseModel):
    type: Literal["error"] = "error"
    message: str
    node: str | None = None


def decode_decision(msg: ResumeMsg):
    """Translate a ResumeMsg into the value LangGraph's Command(resume=...) expects."""
    if msg.decision == "reject":
        return False
    if msg.patch:
        return {"approved": True, "patch": msg.patch}
    return True


async def safe_send(ws: WebSocket, msg: BaseModel) -> bool:
    """Send JSON to the websocket. Returns False if the connection is gone."""
    try:
        await ws.send_text(msg.model_dump_json())
        return True
    except Exception:
        return False
