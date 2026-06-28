from main.repositories.base import BaseRepository

class SpendingRepository(BaseRepository):
    async def get_transactions(self, user_id: str, limit: int = 250, category: str | None = None, source: str | None = None) -> list[dict]:
        query: dict = {"user_id": user_id}
        if category:
            query["category"] = category
        if source:
            query["source"] = source
        
        cursor = self.db["spending_transactions"].find(query).sort("date", -1)
        docs = await cursor.to_list(limit)
        return docs

def get_spending_repo() -> SpendingRepository:
    return SpendingRepository()
