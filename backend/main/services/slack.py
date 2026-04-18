import httpx

from main.config import DEMO_MODE
from main.llm import summarize_text
from main.services.credentials import get_user_token


async def get_slack_unread_summary(user_id: str) -> dict:
    token = await get_user_token(user_id, "slack_access_token")

    if token and token != "demo-token":
        try:
            headers = {"Authorization": f"Bearer {token}"}
            async with httpx.AsyncClient(timeout=20) as client:
                conv_res = await client.get(
                    "https://slack.com/api/users.conversations",
                    params={"types": "public_channel,private_channel,im,mpim", "limit": 50},
                    headers=headers,
                )
                conv_data = conv_res.json()
                channels = conv_data.get("channels", []) if conv_data.get("ok") else []

                unread_total = 0
                parts: list[str] = []

                for channel in channels:
                    unread = int(channel.get("unread_count_display", 0) or 0)
                    unread_total += unread
                    if unread <= 0:
                        continue

                    channel_id = channel.get("id")
                    if not channel_id:
                        continue
                    history = await client.get(
                        "https://slack.com/api/conversations.history",
                        params={"channel": channel_id, "limit": 3},
                        headers=headers,
                    )
                    history_data = history.json()
                    if not history_data.get("ok"):
                        continue
                    snippets = [
                        msg.get("text", "")
                        for msg in history_data.get("messages", [])
                        if msg.get("text")
                    ]
                    if snippets:
                        name = channel.get("name") or channel.get("user") or "channel"
                        parts.append(f"{name}: {' | '.join(snippets)}")

                summary = await summarize_text("slack", " || ".join(parts))
                return {
                    "unread_count": unread_total,
                    "summary_text": summary,
                }
        except Exception:
            pass

    if not DEMO_MODE:
        return {"unread_count": 0, "summary_text": "Connect Slack to fetch unread messages."}

    unread_count = 14
    sample = "Product channel has 5 messages, engineering has 6, founders has 3"
    summary = await summarize_text("slack", sample)
    return {
        "unread_count": unread_count,
        "summary_text": summary,
    }
