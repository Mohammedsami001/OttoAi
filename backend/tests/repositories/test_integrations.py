import pytest
from unittest.mock import AsyncMock, MagicMock

@pytest.mark.asyncio
async def test_get_by_user_id():
    from main.repositories.integrations import IntegrationsRepository
    
    # Arrange
    mock_db = MagicMock()
    mock_collection = MagicMock()
    mock_db.__getitem__.return_value = mock_collection
    
    mock_find_one = AsyncMock()
    mock_find_one.return_value = {"gmail_connected": True}
    mock_collection.find_one = mock_find_one
    
    repo = IntegrationsRepository(db=mock_db)
    
    # Act
    result = await repo.get_by_user_id("user123")
    
    # Assert
    assert result["gmail_connected"] is True

@pytest.mark.asyncio
async def test_update_integration():
    from main.repositories.integrations import IntegrationsRepository
    mock_db = MagicMock()
    mock_collection = AsyncMock()
    mock_db.__getitem__.return_value = mock_collection
    
    repo = IntegrationsRepository(db=mock_db)
    updates = {"gmail_connected": True, "gmail_access_token": "token"}
    
    await repo.update_integration("test_user_1", updates)
    
    # Verify update_one was called with the correct query and updates
    call_args = mock_collection.update_one.call_args
    assert call_args is not None
    
    query, update_doc = call_args.args
    kwargs = call_args.kwargs
    
    assert query == {"user_id": "test_user_1"}
    assert update_doc["$set"]["gmail_connected"] is True
    assert update_doc["$set"]["gmail_access_token"] == "token"
    assert "updated_at" in update_doc["$set"]
    assert update_doc["$setOnInsert"] == {"user_id": "test_user_1"}
    assert kwargs.get("upsert") is True
