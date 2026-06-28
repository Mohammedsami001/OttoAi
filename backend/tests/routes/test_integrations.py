import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient

from main.app import app
from main.dependencies import get_user_id
from main.repositories.integrations import IntegrationsRepository, get_integrations_repo

def override_get_user_id():
    return "test_user_1"

def test_integration_status_empty(monkeypatch):
    mock_repo = MagicMock(spec=IntegrationsRepository)
    mock_repo.get_by_user_id = AsyncMock(return_value=None)
    
    app.dependency_overrides[get_user_id] = override_get_user_id
    app.dependency_overrides[get_integrations_repo] = lambda: mock_repo
    
    client = TestClient(app)
    response = client.get("/integrations/status")
    
    assert response.status_code == 200
    data = response.json()
    assert data["gmail_connected"] is False
    assert data["slack_connected"] is False
    
    mock_repo.get_by_user_id.assert_called_once_with("test_user_1")

def test_integration_status_connected(monkeypatch):
    mock_repo = MagicMock(spec=IntegrationsRepository)
    mock_repo.get_by_user_id = AsyncMock(return_value={"gmail_connected": True, "slack_connected": False})
    
    app.dependency_overrides[get_user_id] = override_get_user_id
    app.dependency_overrides[get_integrations_repo] = lambda: mock_repo
    
    client = TestClient(app)
    response = client.get("/integrations/status")
    
    assert response.status_code == 200
    data = response.json()
    assert data["gmail_connected"] is True
    assert data["slack_connected"] is False
    
    mock_repo.get_by_user_id.assert_called_once_with("test_user_1")

def test_connect_gmail(monkeypatch):
    mock_repo = MagicMock(spec=IntegrationsRepository)
    mock_repo.update_integration = AsyncMock()
    
    app.dependency_overrides[get_user_id] = override_get_user_id
    app.dependency_overrides[get_integrations_repo] = lambda: mock_repo
    
    client = TestClient(app)
    response = client.post("/integrations/connect-gmail", json={"access_token": "my-token"})
    
    assert response.status_code == 200
    assert response.json() == {"ok": True}
    
    # We should verify update_integration was called with the correct dict
    # Wait, the token gets encrypted in the route, so we can't easily assert the exact string unless we mock encrypt_value.
    # Instead, let's just mock encrypt_value.
    mock_repo.update_integration.assert_called_once()
    args, kwargs = mock_repo.update_integration.call_args
    assert args[0] == "test_user_1"
    assert args[1]["gmail_connected"] is True
    assert "gmail_access_token" in args[1]

def test_connect_slack(monkeypatch):
    mock_repo = MagicMock(spec=IntegrationsRepository)
    mock_repo.update_integration = AsyncMock()
    
    app.dependency_overrides[get_user_id] = override_get_user_id
    app.dependency_overrides[get_integrations_repo] = lambda: mock_repo
    
    client = TestClient(app)
    response = client.post("/integrations/connect-slack", json={"access_token": "my-token"})
    
    assert response.status_code == 200
    assert response.json() == {"ok": True}
    
    mock_repo.update_integration.assert_called_once()
    args, kwargs = mock_repo.update_integration.call_args
    assert args[0] == "test_user_1"
    assert args[1]["slack_connected"] is True
    assert "slack_access_token" in args[1]

def test_connect_calendar(monkeypatch):
    mock_repo = MagicMock(spec=IntegrationsRepository)
    mock_repo.update_integration = AsyncMock()
    
    app.dependency_overrides[get_user_id] = override_get_user_id
    app.dependency_overrides[get_integrations_repo] = lambda: mock_repo
    
    client = TestClient(app)
    response = client.post("/integrations/connect-calendar", json={"access_token": "my-token"})
    
    assert response.status_code == 200
    
    mock_repo.update_integration.assert_called_once()
    args, kwargs = mock_repo.update_integration.call_args
    assert args[1]["calendar_connected"] is True
    assert args[1]["meet_connected"] is True
    assert args[1]["docs_connected"] is True

def test_connect_whatsapp(monkeypatch):
    mock_repo = MagicMock(spec=IntegrationsRepository)
    mock_repo.update_integration = AsyncMock()
    
    app.dependency_overrides[get_user_id] = override_get_user_id
    app.dependency_overrides[get_integrations_repo] = lambda: mock_repo
    
    client = TestClient(app)
    response = client.post("/integrations/connect-whatsapp", json={"phone_number": "+1234567890"})
    
    assert response.status_code == 200
    
    mock_repo.update_integration.assert_called_once()
    args, kwargs = mock_repo.update_integration.call_args
    assert args[1]["whatsapp_connected"] is True
    assert args[1]["whatsapp_phone_number"] == "+1234567890"
