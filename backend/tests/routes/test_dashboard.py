import pytest
from unittest.mock import AsyncMock, patch
from main.repositories.daily_summaries import DailySummariesRepository
from main.repositories.integrations import IntegrationsRepository
from main.repositories.spending import SpendingRepository
from main.routes.dashboard import dashboard_summary

@pytest.mark.asyncio
@patch("main.routes.dashboard.get_gmail_unread_summary", new_callable=AsyncMock)
@patch("main.routes.dashboard.get_slack_unread_summary", new_callable=AsyncMock)
@patch("main.routes.dashboard.get_upcoming_events", new_callable=AsyncMock)
@patch("main.routes.dashboard.get_scheduled_meetings", new_callable=AsyncMock)
@patch("main.routes.dashboard.get_recent_docs", new_callable=AsyncMock)
async def test_dashboard_summary(
    mock_get_recent_docs,
    mock_get_scheduled_meetings,
    mock_get_upcoming_events,
    mock_get_slack,
    mock_get_gmail
):
    # Arrange
    mock_get_gmail.return_value = {"unread": 5}
    mock_get_slack.return_value = {"unread": 2}
    mock_get_upcoming_events.return_value = {"upcoming_events": []}
    mock_get_scheduled_meetings.return_value = {"meetings": []}
    mock_get_recent_docs.return_value = {"docs": []}

    user_id = "test-user"
    mock_spending_repo = AsyncMock(spec=SpendingRepository)
    mock_spending_repo.get_transactions.return_value = [{"amount": 50, "category": "food"}, {"amount": 20, "category": "transport"}]
    
    mock_integrations_repo = AsyncMock(spec=IntegrationsRepository)
    mock_integrations_repo.get_by_user_id.return_value = {"gmail_connected": True, "slack_connected": False}
    
    mock_daily_repo = AsyncMock(spec=DailySummariesRepository)
    
    # Act
    result = await dashboard_summary(
        user_id=user_id,
        spending_repo=mock_spending_repo,
        integrations_repo=mock_integrations_repo,
        daily_summaries_repo=mock_daily_repo
    )

    
    # Assert
    assert result["spending"]["total"] == 70.0
    assert result["spending"]["top_category"] == "food"
    assert result["integration_status"]["gmail_connected"] is True
    assert result["integration_status"]["slack_connected"] is False
    
    mock_daily_repo.upsert_daily_summary.assert_called_once()
