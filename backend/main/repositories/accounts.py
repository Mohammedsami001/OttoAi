from main.repositories.base import BaseRepository

class AccountsRepository(BaseRepository):
    async def get_google_accounts(self) -> list[dict]:
        """Get all accounts connected via Google provider."""
        return await self.db["accounts"].find({"provider": "google"}).to_list(1000)

    async def update_access_token(self, account_id: str, new_token: str, expires_at: int) -> None:
        """Update the access token and expiration time for an account."""
        await self.db["accounts"].update_one(
            {"_id": account_id},
            {"$set": {
                "access_token": new_token,
                "expires_at": expires_at
            }}
        )

    async def get_user_by_id(self, user_id: str) -> dict | None:
        """Get a user document by its ID."""
        return await self.db["users"].find_one({"_id": user_id})

def get_accounts_repo() -> AccountsRepository:
    return AccountsRepository()
