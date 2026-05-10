from langchain_tavily import TavilySearch
from langchain_google_genai import ChatGoogleGenerativeAI

search_tool = TavilySearch()



def search_web_impl(query: str) -> list:
    return search_tool.run(query, num_results=1)

def summarize_results_impl(results: list[dict]) -> str:
    summary = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0).run(
        f"Summarize the following research results: {results}"
    )
    return summary

def draft_email_impl(summary: str) -> dict:
    # Placeholder for email drafting implementation
    return {"subject": "Research Summary", "body": summary}

def send_email_impl(email_draft: dict) -> bool:
    # Placeholder for email sending implementation
    return True
