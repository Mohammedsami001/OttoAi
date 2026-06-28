from main.repositories.base import BaseRepository

class IntegrationsRepository(BaseRepository):
    async def get_by_user_id(self, user_id: str) -> dict | None:
        doc = await self.db["user_integrations"].find_one({"user_id": user_id})
        return doc

    async def get_all_user_ids(self) -> list[str]:
        docs = await self.db["user_integrations"].find({}, {"user_id": 1}).to_list(1000)
        return [doc["user_id"] for doc in docs if "user_id" in doc]

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
