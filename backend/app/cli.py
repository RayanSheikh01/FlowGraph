import sys
from langchain_core.runnables import RunnableConfig
from langgraph.types import Command

from .graph import compiled_graph


def main():
    print("Running CLI...")
    if len(sys.argv) <= 1:
        print("Usage: python -m app.cli <topic>")
        return

    config = RunnableConfig(configurable={"thread_id": "cli_thread"})
    topic = sys.argv[1]
    recipient = sys.argv[2] if len(sys.argv) > 2 else "you@example.com"
    state = {
        "topic": topic,
        "recipient_email": recipient,
        "research_results": [],
        "summary": "",
        "email_draft": {},
        "email_sent": False,
        "node_status": {},
        "error": None,
    }

    research_state = compiled_graph.invoke(state, config=config)
    print("=== Research results ===")
    print(research_state.get("research_results"), "\n")

    summary_state = compiled_graph.invoke(Command(resume=True), config=config)
    print("=== Summary ===")
    print(summary_state.get("summary"), "\n")

    draft_state = compiled_graph.invoke(Command(resume=True), config=config)
    print("=== Email draft ===")
    print(draft_state.get("email_draft"), "\n")

    final_state = compiled_graph.invoke(Command(resume=True), config=config)
    print("=== Final state ===")
    print(final_state)

    print("CLI execution completed.")


if __name__ == "__main__":
    main()
    