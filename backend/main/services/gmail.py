import httpx

from main.config import DEMO_MODE
from main.llm import summarize_text
from main.services.credentials import get_user_token


async def get_gmail_unread_summary(user_id: str) -> dict:
    token = await get_user_token(user_id, "gmail_access_token")

    if token and token != "demo-token":
        try:
            headers = {"Authorization": f"Bearer {token}"}
            async with httpx.AsyncClient(timeout=20) as client:
                list_res = await client.get(
                    "https://gmail.googleapis.com/gmail/v1/users/me/messages",
                    params={"q": "is:unread", "maxResults": 10},
                    headers=headers,
                )
                list_res.raise_for_status()
                payload = list_res.json()
                unread_count = int(payload.get("resultSizeEstimate", 0))
                messages = payload.get("messages", [])[:5]

                snippets: list[str] = []
                for item in messages:
                    message_id = item.get("id")
                    if not message_id:
                        continue
                    msg_res = await client.get(
                        f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}",
                        params={"format": "metadata", "metadataHeaders": ["Subject", "From"]},
                        headers=headers,
                    )
                    if msg_res.status_code >= 400:
                        continue
                    msg = msg_res.json()
                    snippet = msg.get("snippet", "")
                    if snippet:
                        snippets.append(snippet)

                summary = await summarize_text("gmail", " | ".join(snippets))
                return {
                    "unread_count": unread_count,
                    "summary_text": summary,
                }
        except Exception:
            pass

    if not DEMO_MODE:
        return {"unread_count": 0, "summary_text": "Connect Gmail to fetch unread emails."}

    unread_count = 7
    sample = "3 finance emails, 2 team updates, 2 action-required threads"
    summary = await summarize_text("gmail", sample)
    return {
        "unread_count": unread_count,
        "summary_text": summary,
    }
