import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from main.adapters.google_client import GoogleClient

@pytest.mark.asyncio
async def test_refresh_access_token():
    client = GoogleClient(client_id="test_id", client_secret="test_secret")
    
    with patch("httpx.AsyncClient") as MockClient:
        mock_post = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"access_token": "new_token"}
        mock_post.return_value = mock_response
        
        mock_instance = MockClient.return_value.__aenter__.return_value
        mock_instance.post = mock_post

        token = await client.refresh_access_token("refresh_tok")
        
        assert token == "new_token"
        mock_post.assert_called_with("https://oauth2.googleapis.com/token", data={
            "client_id": "test_id",
            "client_secret": "test_secret",
            "refresh_token": "refresh_tok",
            "grant_type": "refresh_token",
        })

@pytest.mark.asyncio
async def test_fetch_gmail_messages():
    client = GoogleClient(client_id="test_id", client_secret="test_secret")
    
    with patch("httpx.AsyncClient") as MockClient:
        mock_get = AsyncMock()
        
        # We need to simulate two calls: one for the list, one for the message details
        # 1st call: List
        list_res = MagicMock()
        list_res.status_code = 200
        list_res.json.return_value = {"messages": [{"id": "msg1"}]}
        
        # 2nd call: Message detail
        detail_res = MagicMock()
        detail_res.status_code = 200
        detail_res.json.return_value = {
            "snippet": "Test snippet",
            "threadId": "thread1",
            "payload": {
                "headers": [
                    {"name": "Subject", "value": "Test Subject"},
                    {"name": "From", "value": "test@example.com"}
                ]
            }
        }
        
        # mock_get needs side_effect returning MagicMocks
        mock_get.side_effect = [list_res, detail_res]
        
        mock_instance = MockClient.return_value.__aenter__.return_value
        mock_instance.get = mock_get

        emails = await client.fetch_gmail_messages("acc_tok", limit=1)
        
        assert len(emails) == 1
        assert emails[0]["subject"] == "Test Subject"
        assert emails[0]["from"] == "test@example.com"
        assert emails[0]["snippet"] == "Test snippet"
        
        assert mock_get.call_count == 2
