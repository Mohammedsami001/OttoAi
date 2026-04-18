import asyncio
from datetime import datetime, timezone

from workers.celery_app import celery_app
from main.db import mongo_manager
from main.services.spending import (
    categorize_transaction,
    fetch_gpay_transactions,
    fetch_razorpay_transactions,
)
from main.services.gmail import get_gmail_unread_summary
from main.services.slack import get_slack_unread_summary
from main.services.calendar import get_upcoming_events
from main.services.meet import get_scheduled_meetings
from main.services.docs import get_recent_docs
from main.services.whatsapp import build_daily_briefing, send_whatsapp_message


def _run(coro):
    return asyncio.run(coro)


async def _user_ids() -> list[str]:
    docs = await mongo_manager.user_integrations.find({}, {"user_id": 1}).to_list(1000)
    ids = [row.get("user_id") for row in docs if row.get("user_id")]
    return ids or ["demo-user"]


async def _get_spending_snapshot(user_id: str) -> dict:
    rows = await mongo_manager.spending_transactions.find({"user_id": user_id}).to_list(1000)
    total = round(sum(item.get("amount", 0) for item in rows), 2)
    by_category: dict[str, float] = {}
    for item in rows:
        cat = item.get("category", "other")
        by_category[cat] = by_category.get(cat, 0) + item.get("amount", 0)
    return {
        "total": total,
        "top_category": max(by_category, key=by_category.get) if by_category else "other",
        "transaction_count": len(rows),
    }


@celery_app.task(name="fetch_spending_transactions")
def fetch_spending_transactions():
    async def _task():
        users = await _user_ids()
        for user_id in users:
            incoming = []
            incoming.extend(await fetch_razorpay_transactions(user_id))
            incoming.extend(await fetch_gpay_transactions(user_id))
            for row in incoming:
                row["user_id"] = user_id
                row["category"] = categorize_transaction(row.get("merchant", ""), row.get("description", ""))
                row["notification_sent"] = False
                row["whatsapp_message_id"] = None
                result = await mongo_manager.spending_transactions.update_one(
                    {"user_id": user_id, "transaction_id": row["transaction_id"]},
                    {"$setOnInsert": row},
                    upsert=True,
                )
                if result.upserted_id:
                    text = f"Spending alert: INR {row['amount']} at {row['merchant']} ({row['category']})"
                    wa = await send_whatsapp_message(user_id, text)
                    await mongo_manager.spending_transactions.update_one(
                        {"user_id": user_id, "transaction_id": row["transaction_id"]},
                        {
                            "$set": {
                                "notification_sent": True,
                                "whatsapp_message_id": wa.get("message_id"),
                            }
                        },
                    )

    return _run(_task())


@celery_app.task(name="update_gmail_unread")
def update_gmail_unread():
    async def _task():
        users = await _user_ids()
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        for user_id in users:
            gmail = await get_gmail_unread_summary(user_id)
            await mongo_manager.upsert_daily_summary(user_id, today, {"gmail": gmail})

    return _run(_task())


@celery_app.task(name="update_slack_unread")
def update_slack_unread():
    async def _task():
        users = await _user_ids()
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        for user_id in users:
            slack = await get_slack_unread_summary(user_id)
            await mongo_manager.upsert_daily_summary(user_id, today, {"slack": slack})

    return _run(_task())


@celery_app.task(name="sync_calendar_events")
def sync_calendar_events():
    async def _task():
        users = await _user_ids()
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        for user_id in users:
            calendar = await get_upcoming_events(user_id)
            meet = await get_scheduled_meetings(user_id, calendar.get("upcoming_events", []))
            await mongo_manager.upsert_daily_summary(user_id, today, {"calendar": calendar, "meet": meet})

    return _run(_task())


@celery_app.task(name="sync_docs")
def sync_docs():
    async def _task():
        users = await _user_ids()
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        for user_id in users:
            docs = await get_recent_docs(user_id)
            await mongo_manager.upsert_daily_summary(user_id, today, {"docs": docs})

    return _run(_task())


@celery_app.task(name="send_daily_briefing")
def send_daily_briefing():
    async def _task():
        users = await _user_ids()
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        for user_id in users:
            spending = await _get_spending_snapshot(user_id)
            gmail = await get_gmail_unread_summary(user_id)
            slack = await get_slack_unread_summary(user_id)
            calendar = await get_upcoming_events(user_id)
            meet = await get_scheduled_meetings(user_id, calendar.get("upcoming_events", []))
            docs = await get_recent_docs(user_id)

            payload = {
                "spending": spending,
                "gmail": gmail,
                "slack": slack,
                "calendar": calendar,
                "meet": meet,
                "docs": docs,
            }
            await mongo_manager.upsert_daily_summary(user_id, today, payload)
            await send_whatsapp_message(user_id, build_daily_briefing(payload))

    return _run(_task())
