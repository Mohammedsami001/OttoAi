import asyncio
import httpx
import os
import logging
from datetime import datetime, timezone, timedelta

from main.db import mongo_manager
from main.llm import summarize_text

logger = logging.getLogger(__name__)

# Read credentials - check for env vars first, then try to load from frontend .env.local
def _load_google_creds():
    cid = os.getenv("GOOGLE_CLIENT_ID", "")
    csec = os.getenv("GOOGLE_CLIENT_SECRET", "")
    if not cid or not csec:
        env_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "frontend", ".env.local")
        if os.path.exists(env_path):
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("GOOGLE_CLIENT_ID="):
                        cid = line.split("=", 1)[1]
                    elif line.startswith("GOOGLE_CLIENT_SECRET="):
                        csec = line.split("=", 1)[1]
    return cid, csec

GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET = _load_google_creds()


async def refresh_access_token(refresh_token: str) -> str | None:
    """Use the refresh_token to obtain a fresh access_token from Google."""
    async with httpx.AsyncClient() as client:
        res = await client.post("https://oauth2.googleapis.com/token", data={
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        })
        if res.status_code == 200:
            data = res.json()
            return data.get("access_token")
        else:
            logger.error(f"[Agent] Token refresh failed: {res.status_code} {res.text}")
            return None


async def get_valid_access_token(account: dict, db) -> str | None:
    """Get a valid access token, refreshing if expired."""
    access_token = account.get("access_token")
    expires_at = account.get("expires_at")
    refresh_token = account.get("refresh_token")

    # Check if token is expired (or will expire in next 5 minutes)
    if expires_at:
        expires_dt = datetime.fromtimestamp(expires_at, tz=timezone.utc)
        if datetime.now(timezone.utc) >= expires_dt - timedelta(minutes=5):
            # Token expired or about to expire, refresh it
            if refresh_token:
                logger.info("[Agent] Access token expired, refreshing...")
                new_token = await refresh_access_token(refresh_token)
                if new_token:
                    # Update the token in DB
                    await db["accounts"].update_one(
                        {"_id": account["_id"]},
                        {"$set": {
                            "access_token": new_token,
                            "expires_at": int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp())
                        }}
                    )
                    return new_token
                else:
                    return None
            else:
                logger.warning("[Agent] No refresh_token available, cannot refresh.")
                return None

    return access_token


async def fetch_gmail_messages(access_token: str, limit: int = 20) -> list[dict]:
    """Fetch the latest emails from Gmail and return subject + snippet pairs."""
    async with httpx.AsyncClient() as client:
        # Fetch list of messages
        res = await client.get(
            f"https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults={limit}",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        if res.status_code != 200:
            logger.error(f"[Agent] Gmail list failed: {res.status_code} {res.text}")
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


async def run_gmail_agent():
    """Agent that runs periodically to scan all users' inboxes and summarize them."""
    logger.info("[Agent] Starting Gmail Worker...")
    try:
        db = mongo_manager.client["personal-ops"]
        # Find all accounts connected via NextAuth Google Provider
        accounts = await db["accounts"].find({"provider": "google"}).to_list(1000)

        for account in accounts:
            user_id = account.get("userId")
            if not user_id:
                continue

            # Get a valid access token (refresh if needed)
            access_token = await get_valid_access_token(account, db)
            if not access_token:
                logger.warning(f"[Agent] No valid token for userId={user_id}, skipping.")
                continue

            user = await db["users"].find_one({"_id": user_id})
            if not user:
                continue

            email_data = await fetch_gmail_messages(access_token, limit=20)
            if not email_data:
                logger.info(f"[Agent] No emails found for {user.get('email')}")
                continue

            # Build a structured summary
            email_lines = []
            for i, e in enumerate(email_data, 1):
                email_lines.append(f"{i}. [{e['from']}] {e['subject']}: {e['snippet'][:120]}")

            full_text = "\n".join(email_lines)
            summary_result = await summarize_text("Gmail Inbox", full_text)

            # Save Summary to DB
            summary_doc = {
                "user_email": user.get("email"),
                "date_summarized": datetime.now(timezone.utc).isoformat(),
                "total_emails_processed": len(email_data),
                "summary_text": summary_result,
                "emails": email_data  # Store individual email metadata
            }

            await db["gmail_summaries"].update_one(
                {"user_email": user.get("email")},
                {"$set": summary_doc},
                upsert=True
            )
            logger.info(f"[Agent] Summarized {len(email_data)} emails for {user.get('email')}.")
    except Exception as e:
        logger.error(f"[Agent] Error running Gmail loop: {e}", exc_info=True)


async def run_subscription_agent():
    """Agent that checks all subscriptions and warns if due within 7 days."""
    logger.info("[Agent] Starting Subscription Tracker Worker...")
    try:
        db = mongo_manager.client["personal-ops"]
        subs = await db["subscriptions"].find({"notifications_enabled": True}).to_list(1000)
        now = datetime.now(timezone.utc)

        for sub in subs:
            next_date_str = sub.get("next_billing_date")
            if not next_date_str:
                continue

            try:
                next_date = datetime.fromisoformat(next_date_str.replace("Z", "+00:00"))
            except ValueError:
                # Handle plain date strings like "2026-05-18"
                next_date = datetime.strptime(next_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)

            # Ensure both dates are timezone-aware
            if next_date.tzinfo is None:
                next_date = next_date.replace(tzinfo=timezone.utc)

            days_until = (next_date - now).days

            # Warn 7 Days or less before
            if 0 < days_until <= 7:
                logger.warning(
                    f"[Agent Alert] Subscription {sub.get('name')} for {sub.get('user_email')} "
                    f"is renewing in {days_until} days! Amount: {sub.get('amount')}"
                )

                # Store alert in DB for frontend to read
                await db["subscription_alerts"].update_one(
                    {"subscription_id": sub["_id"]},
                    {"$set": {
                        "user_email": sub.get("user_email"),
                        "name": sub.get("name"),
                        "days_until": days_until,
                        "amount": sub.get("amount"),
                        "next_billing_date": next_date_str,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }},
                    upsert=True
                )

    except Exception as e:
        logger.error(f"[Agent] Error running Subscription loop: {e}", exc_info=True)


async def unified_agent_loop():
    logger.info("[Agent] Autonomous Unified Agent Loop Initiated.")
    while True:
        await run_gmail_agent()
        await run_subscription_agent()
        # Run every 10 minutes for development, change to 3600 for production
        await asyncio.sleep(600)
