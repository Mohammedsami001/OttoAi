import pytest
from unittest.mock import AsyncMock, MagicMock
from bson import ObjectId

from main.repositories.accounts import AccountsRepository

@pytest.mark.asyncio
async def test_get_google_accounts():
    db_mock = MagicMock()
    # Mock the chaining: db["accounts"].find(...).to_list(...)
    cursor_mock = AsyncMock()
    cursor_mock.to_list = AsyncMock(return_value=[{"_id": "acc1", "provider": "google"}])
    db_mock.__getitem__.return_value.find.return_value = cursor_mock

    repo = AccountsRepository(db_mock)
    accounts = await repo.get_google_accounts()
    
    db_mock.__getitem__.assert_called_with("accounts")
    db_mock.__getitem__.return_value.find.assert_called_with({"provider": "google"})
    assert len(accounts) == 1
    assert accounts[0]["_id"] == "acc1"

@pytest.mark.asyncio
async def test_update_access_token():
    db_mock = MagicMock()
    db_mock.__getitem__.return_value.update_one = AsyncMock()

    repo = AccountsRepository(db_mock)
    await repo.update_access_token("acc1", "new_token", 1234567890)
    
    db_mock.__getitem__.assert_called_with("accounts")
    db_mock.__getitem__.return_value.update_one.assert_called_with(
        {"_id": "acc1"},
        {"$set": {"access_token": "new_token", "expires_at": 1234567890}}
    )

@pytest.mark.asyncio
async def test_get_user_by_id():
    db_mock = MagicMock()
    db_mock.__getitem__.return_value.find_one = AsyncMock(return_value={"email": "test@test.com"})

    repo = AccountsRepository(db_mock)
    user = await repo.get_user_by_id("user1")
    
    db_mock.__getitem__.assert_called_with("users")
    db_mock.__getitem__.return_value.find_one.assert_called_with({"_id": "user1"})
    assert user["email"] == "test@test.com"
