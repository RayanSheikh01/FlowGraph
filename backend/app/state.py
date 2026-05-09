import operator
from typing import Annotated, TypedDict


class FlowState(TypedDict):
    topic: str
    research_results: list[dict]
    summary: str
    email_draft: dict
    email_sent: bool
    node_status: Annotated[dict[str, str], operator.or_]
    error: str | None
