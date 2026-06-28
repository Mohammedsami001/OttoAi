import pytest
from unittest.mock import AsyncMock, MagicMock

@pytest.mark.asyncio
async def test_get_transactions_builds_correct_query():
    # We haven't created the repository yet, so we just try to import it
    from main.repositories.spending import SpendingRepository
    
    # Arrange
    mock_db = MagicMock()
    mock_collection = MagicMock()
    mock_db.__getitem__.return_value = mock_collection
    
    # Mock chain: db["spending_transactions"].find(...).sort(...).to_list(...)
    mock_cursor = MagicMock()
    mock_cursor.sort.return_value = mock_cursor
    mock_cursor.to_list = AsyncMock(return_value=[{"amount": 100}])
    mock_collection.find.return_value = mock_cursor
    
    repo = SpendingRepository(db=mock_db)
    
    # Act
    result = await repo.get_transactions(user_id="user123", category="food")
    
    # Assert
    assert result == [{"amount": 100}]
    mock_collection.find.assert_called_once_with({"user_id": "user123", "category": "food"})
    mock_cursor.sort.assert_called_once_with("date", -1)
