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

@pytest.mark.asyncio
async def test_get_calendar_events():
    client = GoogleClient(client_id="test_id", client_secret="test_secret")
    
    with patch("httpx.AsyncClient") as MockClient:
        mock_get = AsyncMock()
        mock_res = MagicMock()
        mock_res.status_code = 200
        mock_res.json.return_value = {
            "items": [
                {
                    "summary": "Meeting",
                    "start": {"dateTime": "2026-06-29T10:00:00Z"},
                    "location": "Zoom",
                    "hangoutLink": "https://meet.google.com/test"
                }
            ]
        }
        mock_get.return_value = mock_res
        
        mock_instance = MockClient.return_value.__aenter__.return_value
        mock_instance.get = mock_get

        events = await client.get_calendar_events("acc_tok", "min_time", "max_time")
        
        assert len(events) == 1
        assert events[0]["title"] == "Meeting"
        assert events[0]["start"] == "2026-06-29T10:00:00Z"
        assert events[0]["location"] == "Zoom"
        assert events[0]["meet_link"] == "https://meet.google.com/test"

@pytest.mark.asyncio
async def test_get_recent_docs():
    client = GoogleClient(client_id="test_id", client_secret="test_secret")
    
    with patch("httpx.AsyncClient") as MockClient:
        mock_get = AsyncMock()
        mock_res = MagicMock()
        mock_res.status_code = 200
        mock_res.json.return_value = {
            "files": [
                {
                    "name": "Doc 1",
                    "owners": [{"displayName": "Alice"}],
                    "modifiedTime": "2026-06-29T10:00:00Z",
                    "shared": True,
                    "webViewLink": "https://docs.google.com/test"
                }
            ]
        }
        mock_get.return_value = mock_res
        
        mock_instance = MockClient.return_value.__aenter__.return_value
        mock_instance.get = mock_get

        docs = await client.get_recent_docs("acc_tok", 10)
        
        assert len(docs) == 1
        assert docs[0]["name"] == "Doc 1"
        assert docs[0]["owner"] == "Alice"
        assert docs[0]["last_modified"] == "2026-06-29T10:00:00Z"
        assert docs[0]["shared"] is True
        assert docs[0]["link"] == "https://docs.google.com/test"
