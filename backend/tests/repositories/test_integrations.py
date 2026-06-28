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
    assert result == {"gmail_connected": True}
    mock_find_one.assert_called_once_with({"user_id": "user123"})
