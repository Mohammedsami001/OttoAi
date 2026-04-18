# OttoAi — Personal Operations Platform

OttoAi is an AI-powered personal operations dashboard that connects your Google Workspace (Gmail, Calendar, Docs) and provides intelligent automation, email summaries, event management, and subscription tracking.

---

## Features

| Feature | Description |
|---------|-------------|
| **Gmail Intelligence** | AI-powered email summaries using Gemini 2.0 Flash, categorized by topic (Security, Dev Tools, AI, etc). Reply to emails with AI-generated drafts. |
| **Calendar & Bookings** | Create events with auto-generated Google Meet links. View, manage, and delete events directly from OttoAi. Status badges (Confirmed / Completed / Cancelled). |
| **Google Docs** | View your 20 most recent Google Docs with direct edit links and sharing status. |
| **Smart Subscriptions** | Track recurring expenses (Netflix, Spotify, etc). The background Python agent monitors renewals and sends alerts. |
| **Event Types** | Create reusable meeting templates (e.g., "30-min Coffee Chat") with quick-book capability. |
| **Profile Management** | Edit your profile, manage integrations, and control settings. |

---

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Framer Motion
- **Backend**: Python (FastAPI), Motor (async MongoDB driver), Google API client
- **Database**: MongoDB (local or Atlas)
- **AI**: Google Gemini 2.0 Flash (email summaries & AI replies)
- **Auth**: NextAuth.js with Google OAuth 2.0
- **APIs**: Gmail API, Google Calendar API, Google Drive API, Google Docs API

---

## Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.9
- **MongoDB** running locally (default: `mongodb://localhost:27017`) or a MongoDB Atlas URI
- **Google Cloud Console project** with the following APIs enabled:
  - Gmail API
  - Google Calendar API
  - Google Drive API
  - Google Docs API

---

## Setup

### 1. Clone & Install

```bash
# Frontend
cd personal-ops-mvp/frontend
npm install

# Backend
cd ../backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Environment Variables

Create `frontend/.env.local`:

```env
# Google OAuth (from Google Cloud Console → Credentials → OAuth 2.0 Client ID)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# MongoDB
MONGODB_URI=mongodb://localhost:27017

# NextAuth
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=any_random_secret_string

# Gemini AI (for email summaries & AI replies)
GEMINI_API_KEY=your_gemini_api_key
```

Create `backend/.env` (if needed):

```env
MONGODB_URI=mongodb://localhost:27017
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project (or use existing)
3. Enable APIs: **Gmail API**, **Google Calendar API**, **Google Drive API**, **Google Docs API**
4. Create **OAuth 2.0 Client ID** (Web application):
   - Authorized redirect URI: `http://localhost:3001/api/auth/callback/google`
5. Copy the Client ID and Client Secret into your `.env.local`

### 4. Start MongoDB

```bash
# If using Homebrew on macOS:
brew services start mongodb-community

# Or run directly:
mongod --dbpath /path/to/data
```

---

## Running the Application

### Start Backend (FastAPI)

```bash
cd personal-ops-mvp/backend
source venv/bin/activate
uvicorn main.app:app --reload --port 8000
```

The backend runs on `http://localhost:8000`.

### Start Frontend (Next.js)

```bash
cd personal-ops-mvp/frontend
npm run dev -- -p 3001
```

The frontend runs on `http://localhost:3001`.

### Access the App

Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## Project Structure

```
personal-ops-mvp/
├── frontend/                    # Next.js 15 Application
│   ├── app/
│   │   ├── api/                 # API Routes
│   │   │   ├── auth/            # NextAuth Google OAuth
│   │   │   ├── calendar/        # Calendar CRUD (events, create, delete)
│   │   │   ├── gmail/           # Gmail fetch, reply, AI summary
│   │   │   ├── google/docs/     # Google Docs listing
│   │   │   ├── subscriptions/   # Subscription CRUD
│   │   │   └── user/            # User preferences, onboarded check
│   │   ├── bookings/            # Calendar event management
│   │   ├── dashboard/           # Event Types dashboard
│   │   ├── docs/                # Google Docs viewer
│   │   ├── getting-started/     # Onboarding wizard
│   │   ├── gmail/               # Gmail summaries + AI reply
│   │   ├── login/               # Login page
│   │   ├── settings/            # Integration settings
│   │   ├── spending/            # Smart Subscriptions
│   │   ├── layout.js            # Root layout with AuthProvider
│   │   └── page.js              # Landing page
│   ├── components/
│   │   ├── layout/AppShell.js   # Sidebar navigation
│   │   └── AuthProvider.js      # NextAuth session provider
│   ├── hooks/                   # Custom React hooks
│   ├── lib/mongodb.js           # MongoDB client singleton
│   └── .env.local               # Environment variables
│
├── backend/                     # Python FastAPI Backend
│   ├── main/
│   │   ├── app.py               # FastAPI application
│   │   ├── llm.py               # Gemini AI integration
│   │   └── services/
│   │       └── agent.py         # Gmail fetching & processing
│   ├── requirements.txt
│   └── venv/                    # Python virtual environment
│
└── README.md                    # This file
```

---

## MongoDB Collections

| Collection | Purpose |
|------------|---------|
| `users` | User profiles (name, email, onboarded flag, working hours) |
| `accounts` | Google OAuth tokens (access_token, refresh_token, scopes) |
| `sessions` | Active NextAuth sessions |
| `gmail_summaries` | Cached AI email summaries |
| `subscriptions` | Tracked subscriptions with renewal dates |
| `event_types` | Reusable meeting templates |

---

## OAuth Scopes

OttoAi requests the following Google OAuth scopes:

- `openid`, `email`, `profile` — Basic user info
- `gmail.readonly` — Read emails for AI summaries
- `gmail.send` — Send AI-generated replies
- `calendar` — Full calendar access (create, read, delete events)
- `documents` — Read Google Docs
- `drive.readonly` — List Google Docs from Drive

> **Note**: If a feature stops working, sign out and sign back in to re-grant all scopes.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Insufficient Permission" on Docs | Sign out → Sign back in to grant `drive.readonly` scope |
| Calendar events not showing in Google Calendar | Check you're viewing the correct Google account in calendar.google.com |
| Gmail summary empty | Ensure Gmail API is enabled and you have emails in your inbox |
| Token expired errors | The app auto-refreshes tokens; if persistent, sign out and back in |
| MongoDB connection failed | Ensure `mongod` is running on port 27017 |

---

## License

MIT
