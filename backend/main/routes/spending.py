from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query

from main.db import mongo_manager
from main.dependencies import get_user_id
from main.models import ConnectGPayRequest, ConnectRazorpayRequest, Subscription
from main.security import encrypt_value
from main.services.spending import categorize_transaction, fetch_gpay_transactions, fetch_razorpay_transactions

router = APIRouter(prefix="/spending", tags=["spending"])


@router.get("/transactions")
async def get_transactions(
    category: str | None = Query(default=None),
    source: str | None = Query(default=None),
    user_id: str = Depends(get_user_id),
):
    query: dict = {"user_id": user_id}
    if category:
        query["category"] = category
    if source:
        query["source"] = source

    docs = await mongo_manager.spending_transactions.find(query).sort("date", -1).to_list(250)
    for doc in docs:
        doc["_id"] = str(doc["_id"])
    return {"items": docs}


@router.get("/summary")
async def get_summary(period: str = Query(default="daily"), user_id: str = Depends(get_user_id)):
    now = datetime.now(timezone.utc)
    if period == "weekly":
        start = now - timedelta(days=7)
    elif period == "monthly":
        start = now - timedelta(days=30)
    else:
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    docs = await mongo_manager.spending_transactions.find(
        {"user_id": user_id, "date": {"$gte": start}}
    ).to_list(1000)
    total = sum(item.get("amount", 0) for item in docs)
    categories: dict[str, float] = {}
    for item in docs:
        cat = item.get("category", "other")
        categories[cat] = categories.get(cat, 0) + item.get("amount", 0)

    top_category = max(categories, key=categories.get) if categories else "other"
    return {
        "period": period,
        "total": round(total, 2),
        "transaction_count": len(docs),
        "top_category": top_category,
    }


@router.get("/categories")
async def get_categories(user_id: str = Depends(get_user_id)):
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$category", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
        {"$project": {"category": "$_id", "total": 1, "count": 1, "_id": 0}},
        {"$sort": {"total": -1}},
    ]
    rows = await mongo_manager.spending_transactions.aggregate(pipeline).to_list(100)
    return {"items": rows}


@router.post("/connect-razorpay")
async def connect_razorpay(payload: ConnectRazorpayRequest, user_id: str = Depends(get_user_id)):
    await mongo_manager.spending_api_keys.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "razorpay_key_id": encrypt_value(payload.key_id),
                "razorpay_key_secret": encrypt_value(payload.key_secret),
                "last_sync_razorpay": None,
            },
            "$setOnInsert": {"user_id": user_id},
        },
        upsert=True,
    )
    return {"ok": True}


@router.post("/connect-gpay")
async def connect_gpay(payload: ConnectGPayRequest, user_id: str = Depends(get_user_id)):
    await mongo_manager.spending_api_keys.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "gpay_api_key": encrypt_value(payload.api_key),
                "gpay_merchant_id": encrypt_value(payload.merchant_id),
                "last_sync_gpay": None,
            },
            "$setOnInsert": {"user_id": user_id},
        },
        upsert=True,
    )
    return {"ok": True}


@router.post("/sync")
async def sync_spending(user_id: str = Depends(get_user_id)):
    incoming = []
    incoming.extend(await fetch_razorpay_transactions(user_id))
    incoming.extend(await fetch_gpay_transactions(user_id))

    inserted = 0
    for item in incoming:
        item["user_id"] = user_id
        item["category"] = categorize_transaction(item.get("merchant", ""), item.get("description", ""))
        item["notification_sent"] = False
        item["whatsapp_message_id"] = None
        try:
            result = await mongo_manager.spending_transactions.update_one(
                {"user_id": user_id, "transaction_id": item["transaction_id"]},
                {"$setOnInsert": item},
                upsert=True,
            )
            if result.upserted_id:
                inserted += 1
        except Exception:
            continue

    return {"inserted": inserted, "fetched": len(incoming)}


@router.get("/subscriptions")
async def get_subscriptions(user_id: str = Depends(get_user_id)):
    user = await mongo_manager.client["personal-ops"]["users"].find_one({"_id": user_id})
    email = user.get("email") if user else user_id
    
    docs = await mongo_manager.client["personal-ops"]["subscriptions"].find({"user_email": email}).to_list(100)
    for doc in docs:
        doc["_id"] = str(doc["_id"])
    return {"items": docs}


@router.post("/subscriptions")
async def create_subscription(sub: Subscription):
    doc = sub.dict()
    await mongo_manager.client["personal-ops"]["subscriptions"].insert_one(doc)
    doc["_id"] = str(doc["_id"])
    return doc
