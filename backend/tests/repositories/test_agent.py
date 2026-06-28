import pytest
from unittest.mock import AsyncMock, MagicMock
from main.repositories.agent import AgentRepository

@pytest.mark.asyncio
async def test_upsert_gmail_summary():
    db_mock = MagicMock()
    db_mock.__getitem__.return_value.update_one = AsyncMock()
    
    repo = AgentRepository(db_mock)
    await repo.upsert_gmail_summary("test@test.com", {"summary": "test"})
    
    db_mock.__getitem__.assert_called_with("gmail_summaries")
    db_mock.__getitem__.return_value.update_one.assert_called_with(
        {"user_email": "test@test.com"},
        {"$set": {"summary": "test"}},
        upsert=True
    )

@pytest.mark.asyncio
async def test_get_active_subscriptions():
    db_mock = MagicMock()
    cursor_mock = AsyncMock()
    cursor_mock.to_list = AsyncMock(return_value=[{"_id": "sub1"}])
    db_mock.__getitem__.return_value.find.return_value = cursor_mock
    
    repo = AgentRepository(db_mock)
    subs = await repo.get_active_subscriptions()
    
    assert len(subs) == 1
    assert subs[0]["_id"] == "sub1"

@pytest.mark.asyncio
async def test_upsert_subscription_alert():
    db_mock = MagicMock()
    db_mock.__getitem__.return_value.update_one = AsyncMock()
    
    repo = AgentRepository(db_mock)
    await repo.upsert_subscription_alert("sub1", {"alert": "yes"})
    
    db_mock.__getitem__.assert_called_with("subscription_alerts")
    db_mock.__getitem__.return_value.update_one.assert_called_with(
        {"subscription_id": "sub1"},
        {"$set": {"alert": "yes"}},
        upsert=True
    )
