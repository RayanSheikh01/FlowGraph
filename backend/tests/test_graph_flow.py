import uuid

from langchain_core.runnables import RunnableConfig
from langgraph.types import Command

from app.graph import compiled_graph


def test_graph_runs_end_to_end_with_mocks():
    config: RunnableConfig = {"configurable": {"thread_id": str(uuid.uuid4())}}
    initial_state = {
        "topic": "Artificial Intelligence",
        "research_results": [],
        "summary": "",
        "email_draft": {},
        "email_sent": False,
        "node_status": {},
        "error": None,
    }

    compiled_graph.invoke(initial_state, config=config)
    compiled_graph.invoke(Command(resume=True), config=config)
    compiled_graph.invoke(Command(resume=True), config=config)
    final_state = compiled_graph.invoke(Command(resume=True), config=config)

    assert final_state["node_status"]["research"] == "completed"
    assert final_state["node_status"]["gate_research"] == "approved"
    assert final_state["node_status"]["summarize"] == "completed"
    assert final_state["node_status"]["gate_summarize"] == "approved"
    assert final_state["node_status"]["draft_email"] == "completed"
    assert final_state["node_status"]["gate_email"] == "approved"
    assert final_state["email_sent"] is True
