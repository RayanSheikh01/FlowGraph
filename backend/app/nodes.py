from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_tavily import TavilySearch
from langgraph.graph import END
from langgraph.types import Command, interrupt
from pydantic import BaseModel

from . import config  # noqa: F401  -- side effect: loads .env into os.environ
from .state import FlowState

search_tool = TavilySearch()
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", temperature=0)


class EmailDraft(BaseModel):
    to: str
    subject: str
    body: str


def _resolve_gate(decision):
    """Return (advance: bool, patch: dict | None) from the resume payload."""
    if decision is True:
        return True, None
    if decision is False:
        return False, None
    if isinstance(decision, dict) and decision.get("approved"):
        return True, decision.get("patch") or None
    return False, None


def research_node(state: FlowState) -> dict:
    raw = search_tool.invoke({"query": state["topic"]})
    results = raw.get("results", []) if isinstance(raw, dict) else raw
    return {
        "research_results": results,
        "node_status": {"research": "completed"},
    }


def gate_research_node(state: FlowState):
    decision = interrupt(
        {
            "step": "gate_research",
            "message": "Approve the research results to proceed to summarization.",
            "preview": state["research_results"],
        }
    )
    advance, patch = _resolve_gate(decision)
    if not advance:
        return Command(
            goto=END,
            update={
                "node_status": {"gate_research": "rejected"},
                "error": "Research rejected by user.",
            },
        )
    update: dict = {"node_status": {"gate_research": "approved"}}
    if isinstance(patch, dict) and "research_results" in patch:
        update["research_results"] = patch["research_results"]
    return Command(goto="summarize", update=update)


def summarize_node(state: FlowState) -> dict:
    summary = llm.invoke(
        f"Summarize the following research results as concise markdown:\n\n{state['research_results']}"
    ).content
    return {
        "summary": summary,
        "node_status": {"summarize": "completed"},
    }


def gate_summarize_node(state: FlowState):
    decision = interrupt(
        {
            "step": "gate_summarize",
            "message": "Approve the summary to proceed to drafting the email.",
            "preview": state["summary"],
        }
    )
    advance, patch = _resolve_gate(decision)
    if not advance:
        return Command(
            goto=END,
            update={
                "node_status": {"gate_summarize": "rejected"},
                "error": "Summary rejected by user.",
            },
        )
    update: dict = {"node_status": {"gate_summarize": "approved"}}
    if isinstance(patch, dict) and "summary" in patch:
        update["summary"] = patch["summary"]
    return Command(goto="draft_email", update=update)


def draft_email_node(state: FlowState) -> dict:
    draft = llm.with_structured_output(EmailDraft).invoke(
        f"Draft an email to {state['recipient_email']} about the topic '{state['topic']}'. "
        f"Use this summary as the body source:\n\n{state['summary']}"
    )
    assert isinstance(draft, EmailDraft)
    payload = draft.model_dump()
    payload["to"] = state["recipient_email"]
    return {
        "email_draft": payload,
        "node_status": {"draft_email": "completed"},
    }


def gate_email_node(state: FlowState):
    decision = interrupt(
        {
            "step": "gate_email",
            "message": "Approve the email draft to send.",
            "preview": state["email_draft"],
        }
    )
    advance, patch = _resolve_gate(decision)
    if not advance:
        return Command(
            goto=END,
            update={
                "node_status": {"gate_email": "rejected"},
                "error": "Email draft rejected by user.",
            },
        )
    update: dict = {"node_status": {"gate_email": "approved"}}
    if isinstance(patch, dict) and isinstance(patch.get("email_draft"), dict):
        update["email_draft"] = {**state["email_draft"], **patch["email_draft"]}
    return Command(goto="send_email", update=update)


def send_email_node(state: FlowState) -> dict:
    return {
        "email_sent": True,
        "node_status": {"send_email": "completed"},
    }
