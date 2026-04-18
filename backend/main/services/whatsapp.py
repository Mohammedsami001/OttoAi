from datetime import datetime
import re

import httpx

from main.config import DEMO_MODE, WAHA_API_KEY, WAHA_BASE_URL
from main.services.credentials import get_user_integration_doc


def _normalize_chat_id(phone_number: str) -> str:
    clean = re.sub(r"\D", "", phone_number or "")
    if not clean:
        return ""
    return f"{clean}@c.us"


async def send_whatsapp_message(user_id: str, message: str) -> dict:
    integration_doc = await get_user_integration_doc(user_id)
    phone = integration_doc.get("whatsapp_phone_number", "")
    chat_id = _normalize_chat_id(phone)

    if WAHA_BASE_URL and WAHA_API_KEY and chat_id:
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                res = await client.post(
                    f"{WAHA_BASE_URL.rstrip('/')}/api/sendText",
                    json={
                        "chatId": chat_id,
                        "text": message,
                        "session": "default",
                    },
                    headers={
                        "Authorization": f"Bearer {WAHA_API_KEY}",
                        "Content-Type": "application/json",
                    },
                )
                res.raise_for_status()
                data = res.json() if res.content else {}
                message_id = (
                    data.get("id")
                    or data.get("message", {}).get("id")
                    or f"wa-{int(datetime.utcnow().timestamp())}"
                )
                return {
                    "sent": True,
                    "message_id": message_id,
                    "message": message,
                }
        except Exception:
            pass

    if not DEMO_MODE:
        return {
            "sent": False,
            "message_id": None,
            "message": message,
        }

    return {
        "sent": True,
        "message_id": f"wa-{int(datetime.utcnow().timestamp())}",
        "message": message,
    }


def build_daily_briefing(payload: dict) -> str:
    spending = payload.get("spending", {})
    gmail = payload.get("gmail", {})
    slack = payload.get("slack", {})
    calendar = payload.get("calendar", {})
    meet = payload.get("meet", {})
    return (
        "Your Intelligence Daily Brief\n"
        f"Spending: INR {spending.get('total', 0)} across {spending.get('transaction_count', 0)} transactions\n"
        f"Gmail unread: {gmail.get('unread_count', 0)}\n"
        f"Slack unread: {slack.get('unread_count', 0)}\n"
        f"Upcoming events: {calendar.get('event_count', 0)}\n"
        f"Scheduled meets: {len(meet.get('scheduled_meetings', []))}"
    )
