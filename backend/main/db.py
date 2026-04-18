from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING, IndexModel
from main.config import MONGO_DB_NAME, MONGO_URI


class MongoManager:
    def __init__(self) -> None:
        self.client = AsyncIOMotorClient(MONGO_URI)
        self.db = self.client[MONGO_DB_NAME]

        self.spending_transactions = self.db["spending_transactions"]
        self.spending_api_keys = self.db["spending_api_keys"]
        self.daily_summaries = self.db["daily_summaries"]
        self.user_integrations = self.db["user_integrations"]

    async def initialize_db(self) -> None:
        await self.spending_transactions.create_indexes(
            [
                IndexModel([("user_id", ASCENDING), ("date", DESCENDING)], name="spending_user_date_idx"),
                IndexModel([("user_id", ASCENDING), ("transaction_id", ASCENDING)], unique=True, name="spending_txn_unique_idx"),
                IndexModel([("source", ASCENDING)], name="spending_source_idx"),
            ]
        )
        await self.spending_api_keys.create_indexes(
            [IndexModel([("user_id", ASCENDING)], unique=True, name="spending_keys_user_unique_idx")]
        )
        await self.daily_summaries.create_indexes(
            [
                IndexModel([("user_id", ASCENDING), ("date", DESCENDING)], unique=True, name="daily_summary_user_date_unique_idx"),
                IndexModel([("updated_at", DESCENDING)], name="daily_summary_updated_idx"),
            ]
        )
        await self.user_integrations.create_indexes(
            [IndexModel([("user_id", ASCENDING)], unique=True, name="user_integrations_user_unique_idx")]
        )

    async def upsert_daily_summary(self, user_id: str, date_str: str, payload: dict) -> None:
        await self.daily_summaries.update_one(
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


mongo_manager = MongoManager()
