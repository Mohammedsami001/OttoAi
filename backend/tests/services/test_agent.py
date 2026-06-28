import pytest
from unittest.mock import AsyncMock, patch

from main.services.agent import run_gmail_agent

@pytest.mark.asyncio
async def test_run_gmail_agent():
    # Mock AccountsRepository
    mock_accounts_repo = AsyncMock()
    # Return one google account
    mock_accounts_repo.get_google_accounts.return_value = [
        {"userId": "user1", "access_token": "valid_tok", "expires_at": 9999999999}
    ]
    mock_accounts_repo.get_user_by_id.return_value = {"email": "test@test.com"}

    # Mock AgentRepository
    mock_agent_repo = AsyncMock()

    # Mock GoogleClient
    mock_google_client = AsyncMock()
    mock_google_client.fetch_gmail_messages.return_value = [
        {"subject": "S1", "from": "F1", "snippet": "Snip1"}
    ]

    with patch("main.services.agent.summarize_text", new_callable=AsyncMock) as mock_summarize:
        mock_summarize.return_value = "Mocked Summary"
        
        await run_gmail_agent(
            accounts_repo=mock_accounts_repo,
            agent_repo=mock_agent_repo,
            google_client=mock_google_client
        )
        
        mock_accounts_repo.get_google_accounts.assert_called_once()
        mock_google_client.fetch_gmail_messages.assert_called_once_with("valid_tok", limit=20)
        mock_summarize.assert_called_once()
        mock_agent_repo.upsert_gmail_summary.assert_called_once()
        
        call_args = mock_agent_repo.upsert_gmail_summary.call_args[0]
        assert call_args[0] == "test@test.com"
        assert call_args[1]["summary_text"] == "Mocked Summary"
        assert call_args[1]["total_emails_processed"] == 1
