import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from main.config import FRONTEND_URL
from main.db import mongo_manager
from main.routes.dashboard import router as dashboard_router
from main.routes.spending import router as spending_router
from main.routes.integrations import router as integrations_router
from main.services.agent import unified_agent_loop


@asynccontextmanager
async def lifespan(_: FastAPI):
    await mongo_manager.initialize_db()
    agent_task = asyncio.create_task(unified_agent_loop())
    yield
    agent_task.cancel()
    mongo_manager.client.close()


app = FastAPI(
    title="Personal OPs Agent API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3001", "http://127.0.0.1:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_router)
app.include_router(spending_router)
app.include_router(integrations_router)


@app.get("/")
async def root() -> dict:
    return {"message": "Personal OPs Agent API is running."}


@app.get("/health")
async def health() -> dict:
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/agent/trigger-gmail")
async def trigger_gmail_agent() -> dict:
    """Manually trigger the Gmail agent to run immediately."""
    from main.services.agent import run_gmail_agent
    try:
        await run_gmail_agent()
        return {"status": "completed", "message": "Gmail agent ran successfully."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
