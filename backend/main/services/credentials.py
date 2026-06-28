from typing import Any

from main.security import decrypt_value
from main.repositories.integrations import get_integrations_repo
from main.repositories.spending import get_spending_repo


def _safe_decrypt(value: str | None) -> str:
    if not value:
        return ""
    try:
        return decrypt_value(value)
    except Exception:
        return ""


async def get_user_integration_doc(user_id: str) -> dict[str, Any]:
    repo = get_integrations_repo()
    doc = await repo.get_by_user_id(user_id)
    return doc or {}


async def get_user_token(user_id: str, field: str) -> str:
    doc = await get_user_integration_doc(user_id)
    token = doc.get(field)
    return _safe_decrypt(token)


async def get_spending_keys(user_id: str) -> dict[str, str]:
    repo = get_spending_repo()
    doc = await repo.get_spending_api_keys(user_id)
    return {
        "razorpay_key_id": _safe_decrypt(doc.get("razorpay_key_id")),
        "razorpay_key_secret": _safe_decrypt(doc.get("razorpay_key_secret")),
        "gpay_api_key": _safe_decrypt(doc.get("gpay_api_key")),
        "gpay_merchant_id": _safe_decrypt(doc.get("gpay_merchant_id")),
    }
