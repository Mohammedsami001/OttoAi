import os
import logging

logger = logging.getLogger(__name__)

GEMINI_API_KEY = None

def _load_gemini_key():
    global GEMINI_API_KEY
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    if not GEMINI_API_KEY:
        env_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "frontend", ".env.local")
        if os.path.exists(env_path):
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("GEMINI_API_KEY="):
                        GEMINI_API_KEY = line.split("=", 1)[1]
                        break

_load_gemini_key()


def _extract_sender_name(from_field: str) -> str:
    if '<' in from_field:
        return from_field.split('<')[0].strip()
    return from_field


async def summarize_text(source: str, raw_text: str) -> str:
    """Summarize email text using Gemini API, with a clean fallback."""
    if not raw_text or not raw_text.strip():
        return "No new content to summarize."

    lines = raw_text.strip().split("\n")

    # Try Gemini API first
    if GEMINI_API_KEY:
        try:
            import httpx
            prompt = f"""You are a smart email assistant. Analyze these {len(lines)} emails and produce a clean, structured briefing.

Rules:
- Group emails by category (🔒 Security, 🎵 Offers & Promotions, 💻 Developer, 🤖 AI, 📩 Other)
- For each category, list key emails with sender name and one-line summary
- End with a "⚡ Quick Actions" section if any emails need attention
- Be concise. Max 15 lines total. No filler.

Emails:
{raw_text}"""

            async with httpx.AsyncClient(timeout=15) as client:
                res = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}",
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"temperature": 0.5, "maxOutputTokens": 500}
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    ai_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    if ai_text:
                        return ai_text.strip()
        except Exception as e:
            logger.warning(f"[LLM] Gemini call failed, using fallback: {e}")

    # Fallback: clean categorized summary
    categories = {}
    for line in lines[:20]:
        line = line.strip()
        if not line:
            continue
        sender = ""
        subject = ""
        if '[' in line and ']' in line:
            sender = line[line.index('[') + 1:line.index(']')]
            rest = line[line.index(']') + 1:].strip()
            if ':' in rest:
                subject = rest.split(':')[0].strip()

        sender_name = _extract_sender_name(sender)
        s_lower = sender.lower()

        if any(k in s_lower for k in ['google.com', 'accounts.google']):
            cat = '🔒 Security'
        elif any(k in s_lower for k in ['spotify', 'netflix']):
            cat = '🎵 Offers'
        elif any(k in s_lower for k in ['openai', 'chatgpt']):
            cat = '🤖 AI'
        elif any(k in s_lower for k in ['warp', 'github']):
            cat = '💻 Dev Tools'
        else:
            cat = '📩 Other'

        if cat not in categories:
            categories[cat] = []
        categories[cat].append(f"{sender_name} — {subject}")

    parts = [f"📬 {len(lines)} emails analyzed\n"]
    for cat, items in categories.items():
        parts.append(f"{cat} ({len(items)})")
        for item in items[:4]:
            parts.append(f"  • {item}")
    return "\n".join(parts)
