import httpx

from main.config import DEMO_MODE
from main.services.credentials import get_user_token


def _format_relative(iso_datetime: str | None) -> str:
    if not iso_datetime:
        return "unknown"
    return iso_datetime

async def get_recent_docs(user_id: str) -> dict:
    token = await get_user_token(user_id, "calendar_access_token")

    if token and token != "demo-token":
        try:
            headers = {"Authorization": f"Bearer {token}"}
            params = {
                "q": "mimeType='application/vnd.google-apps.document' and trashed=false",
                "orderBy": "modifiedTime desc",
                "pageSize": 10,
                "fields": "files(id,name,owners(displayName),modifiedTime,shared,webViewLink)",
            }
            async with httpx.AsyncClient(timeout=20) as client:
                res = await client.get(
                    "https://www.googleapis.com/drive/v3/files",
                    params=params,
                    headers=headers,
                )
                res.raise_for_status()
                files = res.json().get("files", [])

            rows = [
                {
                    "name": file.get("name", "Untitled"),
                    "owner": (file.get("owners") or [{}])[0].get("displayName", "Unknown"),
                    "last_modified": _format_relative(file.get("modifiedTime")),
                    "shared": bool(file.get("shared")),
                    "link": file.get("webViewLink", ""),
                }
                for file in files
            ]
            return {"recent_docs": rows}
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
