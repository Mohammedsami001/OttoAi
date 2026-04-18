import os
import logging
import re

logger = logging.getLogger(__name__)


def _clean_ai_summary(text: str) -> str:
    if not text:
        return text

    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"^\s{0,3}#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*[-*_]{3,}\s*$", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*>\s?", "", text, flags=re.MULTILINE)
    text = text.replace("`", "")
    text = re.sub(r"^\s*[-*]\s+", "- ", text, flags=re.MULTILINE)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

GEMINI_API_KEY = None
MISTRAL_API_KEY = None

def _load_api_keys():
    global GEMINI_API_KEY, MISTRAL_API_KEY
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
    env_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "frontend", ".env.local")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line.startswith("GEMINI_API_KEY=") and not GEMINI_API_KEY:
                    GEMINI_API_KEY = line.split("=", 1)[1]
                elif line.startswith("MISTRAL_API_KEY=") and not MISTRAL_API_KEY:
                    MISTRAL_API_KEY = line.split("=", 1)[1]

_load_api_keys()


def _extract_sender_name(from_field: str) -> str:
    if '<' in from_field:
        return from_field.split('<')[0].strip()
    return from_field


async def summarize_text(source: str, raw_text: str) -> str:
    """Summarize email text using Mistral API, with a clean fallback."""
    if not raw_text or not raw_text.strip():
        return "No new content to summarize."

    lines = raw_text.strip().split("\n")

    # Try Mistral API first. Backward compatibility: user may store a Mistral key in GEMINI_API_KEY.
    mistral_key = MISTRAL_API_KEY or GEMINI_API_KEY
    if mistral_key:
        try:
            import httpx
            prompt = f"""You are a smart email assistant. Analyze these {len(lines)} emails and produce a clean, structured briefing in plain text.

Rules:
- Group emails by category: Security, Offers & Promotions, Developer, AI, Other
- For each category, list key emails with sender name and one-line summary
- End with a Quick Actions section if any emails need attention
- Be concise. Max 15 lines total. No filler
- Output must be plain text only
- Do not use markdown symbols like #, ##, ###, **, __, or ---

Emails:
{raw_text}"""

            async with httpx.AsyncClient(timeout=15) as client:
                res = await client.post(
                    "https://api.mistral.ai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {mistral_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": os.getenv("MISTRAL_MODEL", "mistral-small-latest"),
                        "messages": [
                            {"role": "system", "content": "You are a concise and structured email assistant."},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.5,
                        "max_tokens": 500,
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    ai_text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    if ai_text:
                        return _clean_ai_summary(ai_text)
        except Exception as e:
            logger.warning(f"[LLM] Mistral call failed, using fallback: {e}")

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
