from langgraph.types import interrupt
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_tavily import TavilySearch

from . import config  # noqa: F401  -- side effect: loads .env into os.environ
from .state import FlowState

search_tool = TavilySearch()
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)

def research_node(state: FlowState) -> dict:
    research_topic = state["topic"]
    search_results = search_tool.run(research_topic, num_results=1)
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
    summary = llm.invoke(f"Summarize the following research results: {state['research_results']}").content
    return {
        "summary": summary,
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
    draft = llm.invoke(f"Draft an email based on the following summary: {state['summary']}").content
    return {
        "email_draft": {"subject": "Research Summary", "body": draft},
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
