
async def get_scheduled_meetings(_: str, calendar_events: list[dict]) -> dict:
    meetings = [
        {
            "title": item["title"],
            "start": item["start"],
            "meet_link": item.get("meet_link") or "https://meet.google.com/demo-link",
        }
        for item in calendar_events
        if "meet" in item.get("location", "").lower() or item.get("meet_link")
    ]
    return {"scheduled_meetings": meetings}
