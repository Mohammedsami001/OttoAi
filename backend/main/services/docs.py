from main.config import DEMO_MODE
from main.services.credentials import get_user_token

async def get_recent_docs(user_id: str, google_client=None) -> dict:
    token = await get_user_token(user_id, "calendar_access_token")

    if token and token != "demo-token" and google_client:
        try:
            docs = await google_client.get_recent_docs(token, 10)
            return {"recent_docs": docs}
        except Exception:
            pass

    if not DEMO_MODE:
        return {"recent_docs": []}

    return {
        "recent_docs": [
            {"name": "Q2 Operating Plan", "owner": "Founder Office", "last_modified": "2h ago"},
            {"name": "Fundraise Narrative", "owner": "CEO", "last_modified": "5h ago"},
            {"name": "Hiring Pipeline", "owner": "People Ops", "last_modified": "1d ago"},
        ]
    }
