from datetime import datetime, timezone
from main.repositories.base import BaseRepository

class DailySummariesRepository(BaseRepository):
    async def upsert_daily_summary(self, user_id: str, date_str: str, payload: dict) -> None:
        await self.db["daily_summaries"].update_one(
            {"user_id": user_id, "date": date_str},
            {
                "$set": {
                    **payload,
                    "updated_at": datetime.now(timezone.utc),
                },
                "$setOnInsert": {"user_id": user_id, "date": date_str},
            },
            upsert=True,
        )

def get_daily_summaries_repo() -> DailySummariesRepository:
    return DailySummariesRepository()
