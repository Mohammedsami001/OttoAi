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
