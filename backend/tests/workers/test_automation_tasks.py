import pytest
from unittest.mock import AsyncMock, patch
from workers.automation_tasks import update_gmail_unread, _user_ids

@pytest.mark.asyncio
async def test_user_ids():
    with patch("workers.automation_tasks.get_integrations_repo") as mock_repo_func:
        mock_repo = AsyncMock()
        mock_repo.get_all_user_ids.return_value = ["user1", "user2"]
        mock_repo_func.return_value = mock_repo
        
        ids = await _user_ids()
        assert ids == ["user1", "user2"]

def test_update_gmail_unread():
    with patch("workers.automation_tasks._user_ids", new_callable=AsyncMock) as mock_user_ids, \
         patch("workers.automation_tasks.get_gmail_unread_summary", new_callable=AsyncMock) as mock_get_gmail, \
         patch("workers.automation_tasks.get_daily_summaries_repo") as mock_repo_func:
         
        mock_user_ids.return_value = ["user1"]
        mock_get_gmail.return_value = {"unread": 5}
        
        mock_repo = AsyncMock()
        mock_repo_func.return_value = mock_repo
        
        update_gmail_unread()
        
        mock_repo.upsert_daily_summary.assert_called_once()
        call_args = mock_repo.upsert_daily_summary.call_args[0]
        assert call_args[0] == "user1"
        assert call_args[2] == {"gmail": {"unread": 5}}
