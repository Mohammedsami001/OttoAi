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


async def get_valid_access_token(account: dict, accounts_repo, google_client) -> str | None:
    """Get a valid access token, refreshing if expired."""
    access_token = account.get("access_token")
    expires_at = account.get("expires_at")
    refresh_token = account.get("refresh_token")

    if expires_at:
        expires_dt = datetime.fromtimestamp(expires_at, tz=timezone.utc)
        if datetime.now(timezone.utc) >= expires_dt - timedelta(minutes=5):
            if refresh_token:
                logger.info("[Agent] Access token expired, refreshing...")
                new_token = await google_client.refresh_access_token(refresh_token)
                if new_token:
                    new_expires_at = int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp())
                    await accounts_repo.update_access_token(
                        account["_id"], new_token, new_expires_at
                    )
                    return new_token
                else:
                    return None
            else:
                logger.warning("[Agent] No refresh_token available, cannot refresh.")
                return None

    return access_token


async def run_gmail_agent(accounts_repo, agent_repo, google_client):
    """Agent that runs periodically to scan all users' inboxes and summarize them."""
    logger.info("[Agent] Starting Gmail Worker...")
    try:
        accounts = await accounts_repo.get_google_accounts()

        for account in accounts:
            user_id = account.get("userId")
            if not user_id:
                continue

            access_token = await get_valid_access_token(account, accounts_repo, google_client)
            if not access_token:
                logger.warning(f"[Agent] No valid token for userId={user_id}, skipping.")
                continue

            user = await accounts_repo.get_user_by_id(user_id)
            if not user:
                continue

            email_data = await google_client.fetch_gmail_messages(access_token, limit=20)
            if not email_data:
                logger.info(f"[Agent] No emails found for {user.get('email')}")
                continue

            email_lines = []
            for i, e in enumerate(email_data, 1):
                email_lines.append(f"{i}. [{e['from']}] {e['subject']}: {e['snippet'][:120]}")

            full_text = "\n".join(email_lines)
            summary_result = await summarize_text("Gmail Inbox", full_text)

            summary_doc = {
                "user_email": user.get("email"),
                "date_summarized": datetime.now(timezone.utc).isoformat(),
                "total_emails_processed": len(email_data),
                "summary_text": summary_result,
                "emails": email_data
            }

            await agent_repo.upsert_gmail_summary(user.get("email"), summary_doc)
            logger.info(f"[Agent] Summarized {len(email_data)} emails for {user.get('email')}.")
    except Exception as e:
        logger.error(f"[Agent] Error running Gmail loop: {e}", exc_info=True)


async def run_subscription_agent(agent_repo):
    """Agent that checks all subscriptions and warns if due within 7 days."""
    logger.info("[Agent] Starting Subscription Tracker Worker...")
    try:
        subs = await agent_repo.get_active_subscriptions()
        now = datetime.now(timezone.utc)

        for sub in subs:
            next_date_str = sub.get("next_billing_date")
            if not next_date_str:
                continue

            try:
                next_date = datetime.fromisoformat(next_date_str.replace("Z", "+00:00"))
            except ValueError:
                next_date = datetime.strptime(next_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)

            if next_date.tzinfo is None:
                next_date = next_date.replace(tzinfo=timezone.utc)

            days_until = (next_date - now).days

            if 0 < days_until <= 7:
                logger.warning(
                    f"[Agent Alert] Subscription {sub.get('name')} for {sub.get('user_email')} "
                    f"is renewing in {days_until} days! Amount: {sub.get('amount')}"
                )

                alert_doc = {
                    "user_email": sub.get("user_email"),
                    "name": sub.get("name"),
                    "days_until": days_until,
                    "amount": sub.get("amount"),
                    "next_billing_date": next_date_str,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await agent_repo.upsert_subscription_alert(sub["_id"], alert_doc)

    except Exception as e:
        logger.error(f"[Agent] Error running Subscription loop: {e}", exc_info=True)


async def unified_agent_loop():
    logger.info("[Agent] Autonomous Unified Agent Loop Initiated.")
    
    from main.repositories.accounts import get_accounts_repo
    from main.repositories.agent import get_agent_repo
    from main.adapters.google_client import GoogleClient
    from main.services.agent import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
    
    accounts_repo = get_accounts_repo()
    agent_repo = get_agent_repo()
    google_client = GoogleClient(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)

    while True:
        await run_gmail_agent(accounts_repo, agent_repo, google_client)
        await run_subscription_agent(agent_repo)
        # Run every 10 minutes for development, change to 3600 for production
        await asyncio.sleep(600)
