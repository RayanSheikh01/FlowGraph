from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

from .state import FlowState


def create_flow_graph() -> StateGraph:
    from .nodes import (
        draft_email_node,
        gate_email_node,
        gate_research_node,
        gate_summarize_node,
        research_node,
        send_email_node,
        summarize_node,
    )

    graph = StateGraph(FlowState)
    graph.add_node("research", research_node)
    graph.add_node("gate_research", gate_research_node, destinations=("summarize", END))
    graph.add_node("summarize", summarize_node)
    graph.add_node("gate_summarize", gate_summarize_node, destinations=("draft_email", END))
    graph.add_node("draft_email", draft_email_node)
    graph.add_node("gate_email", gate_email_node, destinations=("send_email", END))
    graph.add_node("send_email", send_email_node)

    graph.add_edge(START, "research")
    graph.add_edge("research", "gate_research")
    graph.add_edge("summarize", "gate_summarize")
    graph.add_edge("draft_email", "gate_email")
    graph.add_edge("send_email", END)

    return graph


graph = create_flow_graph()
saver = MemorySaver()
compiled_graph = graph.compile(checkpointer=saver)

