import httpx
import logging

logger = logging.getLogger(__name__)

class GoogleClient:
    def __init__(self, client_id: str, client_secret: str):
        self.client_id = client_id
        self.client_secret = client_secret

    async def refresh_access_token(self, refresh_token: str) -> str | None:
        """Use the refresh_token to obtain a fresh access_token from Google."""
        async with httpx.AsyncClient() as client:
            res = await client.post("https://oauth2.googleapis.com/token", data={
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            })
            if res.status_code == 200:
                data = res.json()
                return data.get("access_token")
            else:
                logger.error(f"[GoogleClient] Token refresh failed: {res.status_code} {res.text}")
                return None

    async def fetch_gmail_messages(self, access_token: str, limit: int = 20) -> list[dict]:
        """Fetch the latest emails from Gmail and return metadata pairs."""
        async with httpx.AsyncClient() as client:
            res = await client.get(
                f"https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults={limit}",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if res.status_code != 200:
                logger.error(f"[GoogleClient] Gmail list failed: {res.status_code} {res.text}")
                return []

            messages = res.json().get("messages", [])
            emails = []

            for msg in messages:
                msg_id = msg.get("id")
                msg_res = await client.get(
                    f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                if msg_res.status_code == 200:
                    msg_data = msg_res.json()
                    snippet = msg_data.get("snippet", "")
                    thread_id = msg_data.get("threadId", "")
                    headers = msg_data.get("payload", {}).get("headers", [])
                    subject = ""
                    sender = ""
                    for h in headers:
                        if h["name"] == "Subject":
                            subject = h["value"]
                        elif h["name"] == "From":
                            sender = h["value"]
                    emails.append({
                        "messageId": msg_id,
                        "threadId": thread_id,
                        "subject": subject or "(No Subject)",
                        "from": sender,
                        "snippet": snippet
                    })

            return emails

    async def get_calendar_events(self, access_token: str, time_min: str, time_max: str, limit: int = 20) -> list[dict]:
        headers = {"Authorization": f"Bearer {access_token}"}
        params = {
            "singleEvents": "true",
            "orderBy": "startTime",
            "maxResults": limit,
            "timeMin": time_min,
            "timeMax": time_max,
        }
        async with httpx.AsyncClient(timeout=20) as client:
            res = await client.get(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                params=params,
                headers=headers,
            )
            res.raise_for_status()
            items = res.json().get("items", [])

        events = []
        for item in items:
            start = item.get("start", {}).get("dateTime") or item.get("start", {}).get("date")
            location = item.get("location", "")
            meet_link = item.get("hangoutLink") or ""
            events.append(
                {
                    "title": item.get("summary") or "Untitled event",
                    "start": start,
                    "location": location,
                    "meet_link": meet_link,
                }
            )
        return events

    async def get_recent_docs(self, access_token: str, limit: int = 10) -> list[dict]:
        headers = {"Authorization": f"Bearer {access_token}"}
        params = {
            "q": "mimeType='application/vnd.google-apps.document' and trashed=false",
            "orderBy": "modifiedTime desc",
            "pageSize": limit,
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

        def _format_relative(iso_datetime: str | None) -> str:
            if not iso_datetime:
                return "unknown"
            return iso_datetime

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
        return rows
