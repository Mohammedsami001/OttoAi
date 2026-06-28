from main.repositories.base import BaseRepository

class IntegrationsRepository(BaseRepository):
    async def get_by_user_id(self, user_id: str) -> dict | None:
        return await self.db["user_integrations"].find_one({"user_id": user_id})

def get_integrations_repo() -> IntegrationsRepository:
    return IntegrationsRepository()
