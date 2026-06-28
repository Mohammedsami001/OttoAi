import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timezone

@pytest.mark.asyncio
async def test_upsert_daily_summary():
    from main.repositories.daily_summaries import DailySummariesRepository
    
    # Arrange
    mock_db = MagicMock()
    mock_collection = MagicMock()
    mock_db.__getitem__.return_value = mock_collection
    
    mock_update = AsyncMock()
    mock_collection.update_one = mock_update
    
    repo = DailySummariesRepository(db=mock_db)
    payload = {"spending": {"total": 100}}
    
    # Act
    await repo.upsert_daily_summary("user123", "2023-10-01", payload)
    
    # Assert
    mock_update.assert_called_once()
    args, kwargs = mock_update.call_args
    query = args[0]
    update_doc = args[1]
    
    assert query == {"user_id": "user123", "date": "2023-10-01"}
    assert update_doc["$set"]["spending"] == {"total": 100}
    assert "updated_at" in update_doc["$set"]
    assert update_doc["$setOnInsert"] == {"user_id": "user123", "date": "2023-10-01"}
    assert kwargs["upsert"] is True
