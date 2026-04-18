from datetime import datetime, timedelta, timezone
import httpx

from main.config import DEMO_MODE
from main.services.credentials import get_user_token


async def get_upcoming_events(user_id: str) -> dict:
    token = await get_user_token(user_id, "calendar_access_token")

    if token and token != "demo-token":
        try:
            now = datetime.now(timezone.utc)
            max_time = now + timedelta(days=7)
            headers = {"Authorization": f"Bearer {token}"}
            params = {
                "singleEvents": "true",
                "orderBy": "startTime",
                "maxResults": 20,
                "timeMin": now.isoformat(),
                "timeMax": max_time.isoformat(),
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

            return {
                "event_count": len(events),
                "upcoming_events": events,
            }
        except Exception:
            pass

    if not DEMO_MODE:
        return {"event_count": 0, "upcoming_events": []}

    now = datetime.now(timezone.utc)
    events = [
        {
            "title": "Investor update review",
            "start": (now + timedelta(hours=3)).isoformat(),
            "location": "Zoom",
            "meet_link": "",
        },
        {
            "title": "Sprint planning",
            "start": (now + timedelta(days=1, hours=1)).isoformat(),
            "location": "Google Meet",
            "meet_link": "https://meet.google.com/demo-link",
        },
        {
            "title": "Family dinner",
            "start": (now + timedelta(days=2, hours=2)).isoformat(),
            "location": "Home",
            "meet_link": "",
        },
    ]
    return {
        "event_count": len(events),
        "upcoming_events": events,
    }
