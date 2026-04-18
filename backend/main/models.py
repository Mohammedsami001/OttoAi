from datetime import datetime, timezone
from typing import Literal, Optional
from pydantic import BaseModel, Field


CategoryType = Literal[
    "food",
    "transport",
    "shopping",
    "entertainment",
    "utilities",
    "other",
]

SourceType = Literal["razorpay", "gpay"]


class SpendingTransaction(BaseModel):
    user_id: str
    transaction_id: str
    amount: float
    currency: str = "INR"
    merchant: str
    category: CategoryType
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    description: str = ""
    source: SourceType
    notification_sent: bool = False
    whatsapp_message_id: Optional[str] = None


class ConnectRazorpayRequest(BaseModel):
    key_id: str
    key_secret: str


class ConnectGPayRequest(BaseModel):
    api_key: str
    merchant_id: str


class IntegrationConnectRequest(BaseModel):
    access_token: Optional[str] = None
    phone_number: Optional[str] = None


class SpendingSummary(BaseModel):
    period: str
    total: float
    transaction_count: int
    top_category: str


class IntegrationStatus(BaseModel):
    gmail_connected: bool = False
    slack_connected: bool = False
    calendar_connected: bool = False
    meet_connected: bool = False
    docs_connected: bool = False
    whatsapp_connected: bool = False


class DashboardSummary(BaseModel):
    date: str
    spending: dict
    gmail: dict
    slack: dict
    calendar: dict
    meet: dict
    docs: dict
    integration_status: IntegrationStatus


class Subscription(BaseModel):
    user_email: str
    name: str
    amount: float
    start_date: str
    billing_cycle: str  # e.g., "monthly", "yearly"
    next_billing_date: str
    notifications_enabled: bool = True

class GmailSummary(BaseModel):
    user_email: str
    date_summarized: str
    total_emails_processed: int
    summary_text: str
