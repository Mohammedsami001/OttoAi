from main.repositories.base import BaseRepository

class SpendingRepository(BaseRepository):
    async def get_transactions(self, user_id: str, limit: int = 250, category: str | None = None, source: str | None = None, sort_by_date: bool = True) -> list[dict]:
        query: dict = {"user_id": user_id}
        if category:
            query["category"] = category
        if source:
            query["source"] = source
        
        cursor = self.db["spending_transactions"].find(query)
        if sort_by_date:
            cursor = cursor.sort("date", -1)
            
        docs = await cursor.to_list(limit)
        return docs


    async def upsert_transaction(self, user_id: str, row: dict):
        return await self.db["spending_transactions"].update_one(
            {"user_id": user_id, "transaction_id": row["transaction_id"]},
            {"$setOnInsert": row},
            upsert=True,
        )

    async def mark_notification_sent(self, user_id: str, transaction_id: str, message_id: str) -> None:
        await self.db["spending_transactions"].update_one(
            {"user_id": user_id, "transaction_id": transaction_id},
            {
                "$set": {
                    "notification_sent": True,
                    "whatsapp_message_id": message_id,
                }
            },
        )

    async def get_spending_api_keys(self, user_id: str) -> dict:
        return await self.db["spending_api_keys"].find_one({"user_id": user_id}) or {}

def get_spending_repo() -> SpendingRepository:
    return SpendingRepository()
