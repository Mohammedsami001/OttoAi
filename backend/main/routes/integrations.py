from datetime import datetime, timezone
from fastapi import APIRouter, Depends

from main.db import mongo_manager
from main.dependencies import get_user_id
from main.models import IntegrationConnectRequest
from main.security import encrypt_value

router = APIRouter(prefix="/integrations", tags=["integrations"])


def _default_status() -> dict:
    return {
        "gmail_connected": False,
        "slack_connected": False,
        "calendar_connected": False,
        "meet_connected": False,
        "docs_connected": False,
        "whatsapp_connected": False,
    }


@router.get("/status")
async def integration_status(user_id: str = Depends(get_user_id)):
    doc = await mongo_manager.user_integrations.find_one({"user_id": user_id})
    if not doc:
        return _default_status()
    return {
        **_default_status(),
        **{k: doc.get(k, False) for k in _default_status().keys()},
    }


@router.post("/connect-gmail")
async def connect_gmail(payload: IntegrationConnectRequest, user_id: str = Depends(get_user_id)):
    await mongo_manager.user_integrations.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "gmail_connected": True,
                "gmail_access_token": encrypt_value(payload.access_token or "demo-token"),
                "updated_at": datetime.now(timezone.utc),
            },
            "$setOnInsert": {"user_id": user_id},
        },
        upsert=True,
    )
    return {"ok": True}


@router.post("/connect-slack")
async def connect_slack(payload: IntegrationConnectRequest, user_id: str = Depends(get_user_id)):
    await mongo_manager.user_integrations.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "slack_connected": True,
                "slack_access_token": encrypt_value(payload.access_token or "demo-token"),
                "updated_at": datetime.now(timezone.utc),
            },
            "$setOnInsert": {"user_id": user_id},
        },
        upsert=True,
    )
    return {"ok": True}


@router.post("/connect-calendar")
async def connect_calendar(payload: IntegrationConnectRequest, user_id: str = Depends(get_user_id)):
    await mongo_manager.user_integrations.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "calendar_connected": True,
                "meet_connected": True,
                "docs_connected": True,
                "calendar_access_token": encrypt_value(payload.access_token or "demo-token"),
                "updated_at": datetime.now(timezone.utc),
            },
            "$setOnInsert": {"user_id": user_id},
        },
        upsert=True,
    )
    return {"ok": True}


@router.post("/connect-whatsapp")
async def connect_whatsapp(payload: IntegrationConnectRequest, user_id: str = Depends(get_user_id)):
    await mongo_manager.user_integrations.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "whatsapp_connected": True,
                "whatsapp_phone_number": payload.phone_number,
                "updated_at": datetime.now(timezone.utc),
            },
            "$setOnInsert": {"user_id": user_id},
        },
        upsert=True,
    )
    return {"ok": True}
