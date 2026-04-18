import os
from dotenv import load_dotenv

load_dotenv()

APP_ENV = os.getenv("APP_ENV", "dev")
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"

API_PORT = int(os.getenv("API_PORT", "8001"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3001")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "personal-ops")

CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")

APP_ENCRYPTION_KEY = os.getenv("APP_ENCRYPTION_KEY", "")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

RAZORPAY_BASE_URL = os.getenv("RAZORPAY_BASE_URL", "https://api.razorpay.com")
GPAY_TRANSACTIONS_ENDPOINT = os.getenv("GPAY_TRANSACTIONS_ENDPOINT", "")

WAHA_BASE_URL = os.getenv("WAHA_BASE_URL", "")
WAHA_API_KEY = os.getenv("WAHA_API_KEY", "")
