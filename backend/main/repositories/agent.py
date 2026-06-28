from main.repositories.base import BaseRepository

class AgentRepository(BaseRepository):
    async def upsert_gmail_summary(self, user_email: str, summary_doc: dict) -> None:
        """Upsert a gmail summary for a specific user."""
        await self.db["gmail_summaries"].update_one(
            {"user_email": user_email},
            {"$set": summary_doc},
            upsert=True
        )

    async def get_active_subscriptions(self) -> list[dict]:
        """Get all subscriptions that have notifications enabled."""
        return await self.db["subscriptions"].find({"notifications_enabled": True}).to_list(1000)
        
    async def upsert_subscription_alert(self, subscription_id: str, alert_doc: dict) -> None:
        """Upsert an alert for a subscription."""
        await self.db["subscription_alerts"].update_one(
            {"subscription_id": subscription_id},
            {"$set": alert_doc},
            upsert=True
        )

def get_agent_repo() -> AgentRepository:
    return AgentRepository()
