from datetime import datetime, timedelta, timezone

from main.config import DEMO_MODE
from main.services.credentials import get_user_token


async def get_upcoming_events(user_id: str, google_client=None) -> dict:
    token = await get_user_token(user_id, "calendar_access_token")

    if token and token != "demo-token" and google_client:
        try:
            now = datetime.now(timezone.utc)
            max_time = now + timedelta(days=7)
            events = await google_client.get_calendar_events(token, now.isoformat(), max_time.isoformat(), 20)
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
