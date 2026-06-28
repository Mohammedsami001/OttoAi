from main.repositories.base import BaseRepository

class IntegrationsRepository(BaseRepository):
    async def get_by_user_id(self, user_id: str) -> dict | None:
        doc = await self.db["user_integrations"].find_one({"user_id": user_id})
        return doc

    async def update_integration(self, user_id: str, updates: dict) -> None:
        from datetime import datetime, timezone
        
        update_fields = {**updates, "updated_at": datetime.now(timezone.utc)}
        
        await self.db["user_integrations"].update_one(
            {"user_id": user_id},
            {
                "$set": update_fields,
                "$setOnInsert": {"user_id": user_id},
            },
            upsert=True,
        )

def get_integrations_repo() -> IntegrationsRepository:
    return IntegrationsRepository()
