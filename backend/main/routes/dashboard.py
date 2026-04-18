from datetime import datetime, timezone
from fastapi import APIRouter, Depends

from main.db import mongo_manager
from main.dependencies import get_user_id
from main.services.calendar import get_upcoming_events
from main.services.docs import get_recent_docs
from main.services.gmail import get_gmail_unread_summary
from main.services.meet import get_scheduled_meetings
from main.services.slack import get_slack_unread_summary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
async def dashboard_summary(user_id: str = Depends(get_user_id)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    spending_docs = await mongo_manager.spending_transactions.find({"user_id": user_id}).to_list(500)
    spend_total = round(sum(x.get("amount", 0) for x in spending_docs), 2)
    by_category: dict[str, float] = {}
    for row in spending_docs:
        key = row.get("category", "other")
        by_category[key] = by_category.get(key, 0) + row.get("amount", 0)
    top_category = max(by_category, key=by_category.get) if by_category else "other"

    gmail = await get_gmail_unread_summary(user_id)
    slack = await get_slack_unread_summary(user_id)
    calendar = await get_upcoming_events(user_id)
    meet = await get_scheduled_meetings(user_id, calendar.get("upcoming_events", []))
    docs = await get_recent_docs(user_id)

    integration_doc = await mongo_manager.user_integrations.find_one({"user_id": user_id})
    integration_status = {
        "gmail_connected": bool(integration_doc and integration_doc.get("gmail_connected")),
        "slack_connected": bool(integration_doc and integration_doc.get("slack_connected")),
        "calendar_connected": bool(integration_doc and integration_doc.get("calendar_connected")),
        "meet_connected": bool(integration_doc and integration_doc.get("meet_connected")),
        "docs_connected": bool(integration_doc and integration_doc.get("docs_connected")),
        "whatsapp_connected": bool(integration_doc and integration_doc.get("whatsapp_connected")),
    }

    payload = {
        "spending": {
            "total": spend_total,
            "top_category": top_category,
            "transaction_count": len(spending_docs),
        },
        "gmail": gmail,
        "slack": slack,
        "calendar": calendar,
        "meet": meet,
        "docs": docs,
        "integration_status": integration_status,
    }

    await mongo_manager.upsert_daily_summary(user_id, today, payload)

    return {
        "date": today,
        **payload,
    }
