from langgraph.types import interrupt

from .state import FlowState


def research_node(state: FlowState) -> dict:
    research_topic = state["topic"]
    search_results = [
        {"title": f"Result for {research_topic}", "link": "http://example.com"}
    ]
    return {
        "research_results": search_results,
        "node_status": {"research": "completed"},
    }


def gate_research_node(state: FlowState) -> dict:
    approved = interrupt(
        {
            "step": "gate_research",
            "message": "Do you want to proceed with the summary of the results?",
            "preview": state["research_results"],
        }
    )
    status = "approved" if approved else "rejected"
    return {"node_status": {"gate_research": status}}


def summarize_node(state: FlowState) -> dict:
    return {
        "summary": "This is a summary of the research results.",
        "node_status": {"summarize": "completed"},
    }


def gate_summarize_node(state: FlowState) -> dict:
    approved = interrupt(
        {
            "step": "gate_summarize",
            "message": "Do you want to proceed with drafting the email?",
            "preview": state["summary"],
        }
    )
    status = "approved" if approved else "rejected"
    return {"node_status": {"gate_summarize": status}}


def draft_email_node(state: FlowState) -> dict:
    return {
        "email_draft": {"subject": "Research Summary", "body": state["summary"]},
        "node_status": {"draft_email": "completed"},
    }


def gate_email_node(state: FlowState) -> dict:
    approved = interrupt(
        {
            "step": "gate_email",
            "message": "Do you want to proceed with sending the email?",
            "preview": state["email_draft"],
        }
    )
    status = "approved" if approved else "rejected"
    return {"node_status": {"gate_email": status}}


def send_email_node(state: FlowState) -> dict:
    return {
        "email_sent": True,
        "node_status": {"send_email": "completed"},
    }
