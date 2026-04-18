from fastapi import Header
from main.db import mongo_manager


async def get_user_id(x_user_id: str | None = Header(default=None)) -> str:
    return x_user_id or "demo-user"
