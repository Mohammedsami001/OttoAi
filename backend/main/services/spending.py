from datetime import datetime, timedelta, timezone
from typing import Any
import httpx

from main.config import DEMO_MODE, GPAY_TRANSACTIONS_ENDPOINT, RAZORPAY_BASE_URL
from main.services.credentials import get_spending_keys


CATEGORY_KEYWORDS = {
    "food": ["swiggy", "zomato", "restaurant", "cafe"],
    "transport": ["uber", "ola", "metro", "fuel"],
    "shopping": ["amazon", "flipkart", "myntra"],
    "entertainment": ["netflix", "spotify", "bookmyshow"],
    "utilities": ["electricity", "water", "internet", "mobile"],
}


def categorize_transaction(merchant: str, description: str = "") -> str:
    source = f"{merchant} {description}".lower()
    for category, words in CATEGORY_KEYWORDS.items():
        if any(word in source for word in words):
            return category
    return "other"


async def fetch_razorpay_transactions(_: str) -> list[dict[str, Any]]:
    user_id = _
    keys = await get_spending_keys(user_id)
    key_id = keys.get("razorpay_key_id", "")
    key_secret = keys.get("razorpay_key_secret", "")

    if key_id and key_secret:
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                res = await client.get(
                    f"{RAZORPAY_BASE_URL.rstrip('/')}/v1/payments",
                    params={"count": 25},
                    auth=(key_id, key_secret),
                )
                res.raise_for_status()
                items = res.json().get("items", [])

            rows = []
            for item in items:
                created_at = item.get("created_at")
                created_dt = (
                    datetime.fromtimestamp(created_at, tz=timezone.utc)
                    if isinstance(created_at, (int, float))
                    else datetime.now(timezone.utc)
                )
                amount = float(item.get("amount", 0)) / 100.0
                merchant = item.get("description") or item.get("method") or "Razorpay"
                rows.append(
                    {
                        "transaction_id": item.get("id") or f"rzp-{int(created_dt.timestamp())}",
                        "amount": amount,
                        "currency": item.get("currency", "INR"),
                        "merchant": merchant,
                        "description": item.get("description") or "",
                        "date": created_dt,
                        "source": "razorpay",
                    }
                )
            return rows
        except Exception:
            pass

    return []


async def fetch_gpay_transactions(_: str) -> list[dict[str, Any]]:
    user_id = _
    keys = await get_spending_keys(user_id)
    api_key = keys.get("gpay_api_key", "")
    merchant_id = keys.get("gpay_merchant_id", "")

    if GPAY_TRANSACTIONS_ENDPOINT and api_key:
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                res = await client.get(
                    GPAY_TRANSACTIONS_ENDPOINT,
                    params={"merchant_id": merchant_id, "limit": 25},
                    headers={"Authorization": f"Bearer {api_key}"},
                )
                res.raise_for_status()
                payload = res.json()

            raw_items = payload.get("items") or payload.get("transactions") or payload.get("data") or []
            rows = []
            for item in raw_items:
                transaction_id = str(item.get("transaction_id") or item.get("id") or "")
                if not transaction_id:
                    continue
                raw_amount = item.get("amount", 0)
                amount = float(raw_amount) if isinstance(raw_amount, (int, float, str)) else 0.0
                merchant = item.get("merchant") or item.get("merchant_name") or "Google Pay"
                date_raw = item.get("date") or item.get("created_at") or item.get("timestamp")
                if isinstance(date_raw, (int, float)):
                    date_value = datetime.fromtimestamp(date_raw, tz=timezone.utc)
                elif isinstance(date_raw, str):
                    try:
                        date_value = datetime.fromisoformat(date_raw.replace("Z", "+00:00"))
                    except Exception:
                        date_value = datetime.now(timezone.utc)
                else:
                    date_value = datetime.now(timezone.utc)

                rows.append(
                    {
                        "transaction_id": transaction_id,
                        "amount": amount,
                        "currency": item.get("currency", "INR"),
                        "merchant": merchant,
                        "description": item.get("description") or "",
                        "date": date_value,
                        "source": "gpay",
                    }
                )
            return rows
        except Exception:
            pass

    return []
