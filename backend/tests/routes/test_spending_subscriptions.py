from fastapi.testclient import TestClient
from main.app import app
import pytest
from unittest.mock import patch, AsyncMock

client = TestClient(app)

def test_get_subscriptions():
    with patch("main.routes.spending.get_accounts_repo") as mock_accounts_func, \
         patch("main.routes.spending.get_agent_repo") as mock_agent_func:
         
        mock_accounts = AsyncMock()
        mock_accounts.get_user_by_id.return_value = {"email": "test@test.com"}
        mock_accounts_func.return_value = mock_accounts
        
        mock_agent = AsyncMock()
        mock_agent.get_user_subscriptions.return_value = [{"_id": "sub1", "name": "Netflix"}]
        mock_agent_func.return_value = mock_agent

        response = client.get("/spending/subscriptions", headers={"Authorization": "Bearer fake-token"})
        assert response.status_code == 200
        assert response.json()["items"] == [{"_id": "sub1", "name": "Netflix"}]

def test_create_subscription():
    with patch("main.routes.spending.get_agent_repo") as mock_agent_func:
        mock_agent = AsyncMock()
        
        async def mock_create(doc):
            doc["_id"] = "new_sub_id"
            
        mock_agent.create_subscription = AsyncMock(side_effect=mock_create)
        mock_agent_func.return_value = mock_agent

        response = client.post(
            "/spending/subscriptions",
            json={"user_email": "test@test.com", "name": "Netflix", "amount": 10.99, "start_date": "2026-06-01", "billing_cycle": "monthly", "next_billing_date": "2026-07-01", "notifications_enabled": True}
        )
        assert response.status_code == 200
        mock_agent.create_subscription.assert_called_once()
