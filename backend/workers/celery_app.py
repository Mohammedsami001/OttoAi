from celery import Celery
from celery.schedules import crontab

from main.config import CELERY_BROKER_URL, CELERY_RESULT_BACKEND

celery_app = Celery(
    "personal_ops_tasks",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=["workers.automation_tasks"],
)

celery_app.conf.update(
    task_track_started=True,
    timezone="UTC",
    beat_schedule={
        "fetch-spending-transactions-every-15-min": {
            "task": "fetch_spending_transactions",
            "schedule": 900.0,
        },
        "update-gmail-unread-every-30-min": {
            "task": "update_gmail_unread",
            "schedule": 1800.0,
        },
        "update-slack-unread-every-30-min": {
            "task": "update_slack_unread",
            "schedule": 1800.0,
        },
        "sync-calendar-events-every-hour": {
            "task": "sync_calendar_events",
            "schedule": 3600.0,
        },
        "sync-docs-every-4-hours": {
            "task": "sync_docs",
            "schedule": 14400.0,
        },
        "send-daily-briefing-10am-utc": {
            "task": "send_daily_briefing",
            "schedule": crontab(hour=10, minute=0),
        },
    },
)
