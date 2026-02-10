# Smart Event Management & Networking Platform

A full-stack, AI-powered event management system that combines a **FastAPI + MongoDB** backend, a **React/Vite** real-time dashboard, and a **Next.js** admin portal — all integrated with RAG-based AI assistance, intelligent networking recommendations, and comprehensive event lifecycle management.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup (event-platform)](#backend-setup-event-platform)
  - [Frontend Dashboard Setup (eventnexus-ai)](#frontend-dashboard-setup-eventnexus-ai)
  - [Admin Portal Setup (event_ai)](#admin-portal-setup-event_ai)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [AI & RAG System](#ai--rag-system)
- [Authentication & RBAC](#authentication--rbac)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Client Layer                                │
│                                                                      │
│  ┌─────────────────────┐          ┌─────────────────────────────┐   │
│  │   eventnexus-ai     │          │       event_ai              │   │
│  │   React + Vite      │          │       Next.js 16            │   │
│  │   Real-time Dash    │          │       Admin Portal           │   │
│  │   Port: 5173        │          │       Port: 3000             │   │
│  └────────┬────────────┘          └──────────────┬──────────────┘   │
│           │                                      │                   │
└───────────┼──────────────────────────────────────┼───────────────────┘
            │            REST / JSON               │
            ▼                                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        event-platform                                │
│                     FastAPI Backend (Port: 8000)                      │
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌────────────────────────┐ │
│  │  Events   │ │ Tickets  │ │  Payments │ │   AI / RAG Engine      │ │
│  │  Router   │ │ Router   │ │  Router   │ │  Networking + Chatbot  │ │
│  └──────────┘ └──────────┘ └───────────┘ └────────────────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌────────────────────────┐ │
│  │  Orgs     │ │ Waitlist │ │ Registr.  │ │  Auth + RBAC           │ │
│  │  Router   │ │ Router   │ │  Router   │ │  JWT + Dev Header      │ │
│  └──────────┘ └──────────┘ └───────────┘ └────────────────────────┘ │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   MongoDB Atlas  │
                    │   (or local)     │
                    └─────────────────┘
```

---

## Features

### Event Management
- **Full Event Lifecycle** — Create, publish, manage, and complete events with draft/published/live/completed statuses
- **Registration System** — Multi-step registration with custom form fields, capacity tracking, and waitlist overflow
- **Ticketing** — Multiple ticket types per event, pricing tiers, discount codes, and QR code generation
- **Waitlist Management** — Automatic waitlist when events reach capacity, with priority-based promotion
- **Venue Editor** — Interactive drag-and-drop floor plan editor for booths, seating, stages, and amenities

### AI & Intelligent Features
- **RAG-Powered Chatbot** — Ask natural-language questions about events, attendees, schedules, and logistics; answers are retrieved from live MongoDB data
- **AI Networking Recommendations** — Weighted similarity matching across interests, skills, industry, role, goals, and location
- **Conversation Starters** — Auto-generated ice-breaker suggestions based on shared interests between matched attendees
- **Smart Agenda Generation** — AI-curated personalized event agendas based on attendee profiles

### Multi-Tenant & Organization
- **Organization Management** — Create and manage organizations with slug-based routing
- **Role-Based Access Control (RBAC)** — Four roles: Super Admin, Organizer, Staff, Attendee — each with granular permissions
- **Multi-tenant Events** — Events scoped to organizations with membership tracking

### Payment Integration
- **Stripe** — Full checkout flow with webhook support for payment confirmation
- **PayPal** — Sandbox and production payment processing
- **Revenue Analytics** — Per-event revenue tracking and aggregation

### Frontend Dashboard (eventnexus-ai)
- **Real-time Analytics** — Registration trends, revenue metrics, attendee satisfaction charts
- **Event Engagement Hub** — Live session management, capacity tracking, join/leave functionality
- **Badge Designer** — Visual badge template editor with QR code, text, and image elements
- **AI Assistant Panel** — Integrated chatbot UI connected to the RAG backend
- **AI Networking Panel** — Smart attendee matching with compatibility scores and conversation starters
- **Dark/Light Theme** — Full theme support with smooth transitions
- **Gesture & Voice Navigation** — Experimental gesture mode and voice command hooks
- **Role-based Views** — Organizer and Attendee personas with different sidebar navigation

### Admin Portal (event_ai)
- **Next.js 16 Admin Dashboard** — Server-side rendered admin interface
- **NextAuth Authentication** — Secure login with credential-based auth and bcrypt password hashing
- **Event CRUD API** — RESTful Next.js API routes for event management
- **Mongoose Models** — Event, Organization, Registration, TicketType, and User models
- **shadcn/ui Components** — Modern, accessible UI components built on Radix UI primitives

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend API** | Python 3.12, FastAPI, Uvicorn, Motor (async MongoDB), Pydantic v2 |
| **Database** | MongoDB (Atlas or local), Mongoose (Next.js portal) |
| **AI/RAG** | SentenceTransformers (optional), Token-Jaccard fallback, Cosine similarity |
| **Auth** | JWT (python-jose), Passlib + bcrypt, NextAuth |
| **Payments** | Stripe SDK, PayPal REST SDK |
| **Email** | SMTP via Jinja2 templates |
| **Export** | Pandas + openpyxl (Excel), QR code generation (qrcode + Pillow) |
| **Task Queue** | Celery + Redis (background jobs) |
| **Frontend Dashboard** | React 19, Vite 6, TypeScript, Recharts, Lucide icons, TailwindCSS |
| **Admin Portal** | Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui, Zod validation |

---

## Project Structure

```
Smart-Event-Management-Networking-Platform/
│
├── event-platform/              # FastAPI Backend
│   ├── app/
│   │   ├── ai/                  # AI modules
│   │   │   ├── networking.py    # Attendee matching & recommendations
│   │   │   ├── rag.py           # RAG chatbot engine
│   │   │   └── similarity.py    # Weighted similarity scoring
│   │   ├── models/              # MongoDB document models
│   │   │   ├── base.py          # PyObjectId + MongoModel base
│   │   │   ├── event.py         # Event model
│   │   │   ├── organization.py  # Organization model
│   │   │   ├── registration.py  # Registration model
│   │   │   ├── ticket.py        # Ticket model
│   │   │   ├── user.py          # User model
│   │   │   ├── user_organization.py  # Membership + roles
│   │   │   └── waitlist.py      # Waitlist entry model
│   │   ├── routers/             # API route handlers
│   │   │   ├── ai.py            # /api/ai/* endpoints
│   │   │   ├── events.py        # /api/events/* endpoints
│   │   │   ├── organizations.py # /api/organizations/* endpoints
│   │   │   ├── payment.py       # /api/payments/* endpoints
│   │   │   ├── registration.py  # /api/registrations/* endpoints
│   │   │   ├── tickets.py       # /api/tickets/* endpoints
│   │   │   └── waitlist.py      # /api/waitlist/* endpoints
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/            # Business logic services
│   │   │   ├── email_service.py
│   │   │   ├── payment_service.py
│   │   │   ├── pricing_service.py
│   │   │   ├── qrcode_service.py
│   │   │   └── registration_service.py
│   │   ├── auth.py              # JWT + dev header authentication
│   │   ├── config.py            # Pydantic settings (env-driven)
│   │   ├── database.py          # MongoDB connection + indexes
│   │   ├── main.py              # FastAPI app entry point
│   │   └── rbac.py              # Role-permission mapping
│   ├── .env.example             # Environment variable template
│   └── requirements.txt         # Python dependencies
│
├── eventnexus-ai/               # React/Vite Frontend Dashboard
│   ├── components/
│   │   ├── AIAssistant.tsx      # RAG chatbot UI
│   │   ├── AINetworking.tsx     # Smart networking panel
│   │   ├── Badges.tsx           # Badge designer
│   │   ├── Dashboard.tsx        # Analytics dashboard
│   │   ├── EventEngagement.tsx  # Event hub + sessions
│   │   ├── Settings.tsx         # Theme & preferences
│   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   └── VenueEditor.tsx      # Floor plan editor
│   ├── services/
│   │   ├── api.ts               # Backend API client
│   │   └── geminiService.ts     # Gemini AI fallback
│   ├── App.tsx                  # Main app shell
│   ├── constants.tsx            # Nav items, mock data
│   ├── types.ts                 # TypeScript interfaces
│   └── package.json
│
├── event_ai/                    # Next.js Admin Portal
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/             # API routes (events, auth)
│   │   │   ├── dashboard/       # Dashboard pages
│   │   │   ├── login/           # Auth pages
│   │   │   └── layout.tsx       # Root layout
│   │   ├── components/ui/       # shadcn/ui components
│   │   ├── contexts/            # React contexts
│   │   ├── lib/                 # Utilities
│   │   ├── models/              # Mongoose models
│   │   └── types/               # TypeScript types
│   ├── ai/                      # Python AI scripts
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Python** | 3.11 or 3.12 | Backend API |
| **Node.js** | 18+ | Frontend + Admin portal |
| **MongoDB** | 6+ (or Atlas) | Database |
| **Git** | 2.30+ | Version control |

### Backend Setup (event-platform)

```bash
# 1. Navigate to backend directory
cd event-platform

# 2. Create a Python 3.12 virtual environment
python -m venv .venv

# 3. Activate the virtual environment
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB URI, Stripe keys, etc.

# 6. Start the API server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at:
- **API Root**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### Frontend Dashboard Setup (eventnexus-ai)

```bash
# 1. Navigate to frontend directory
cd eventnexus-ai

# 2. Install dependencies
npm install

# 3. (Optional) Set backend URL
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local

# 4. Start the development server
npm run dev
```

The dashboard will be available at: **http://localhost:5173**

### Admin Portal Setup (event_ai)

```bash
# 1. Navigate to admin portal directory
cd event_ai

# 2. Install dependencies
npm install

# 3. Start the Next.js development server
npm run dev
```

The admin portal will be available at: **http://localhost:3000**

---

## Environment Variables

### Backend (`event-platform/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URL` | MongoDB connection string | `mongodb://localhost:27017` or Atlas URI |
| `DATABASE_NAME` | Database name | `event_platform` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |
| `PAYPAL_MODE` | PayPal mode | `sandbox` or `live` |
| `PAYPAL_CLIENT_ID` | PayPal client ID | Your PayPal client ID |
| `PAYPAL_CLIENT_SECRET` | PayPal client secret | Your PayPal secret |
| `SMTP_HOST` | Email SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | `your-email@gmail.com` |
| `SMTP_PASSWORD` | SMTP app password | Your app password |
| `EMAIL_FROM` | Sender email address | `noreply@eventplatform.com` |
| `SECRET_KEY` | JWT signing secret | A random secure string |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token TTL | `30` |
| `APP_URL` | Frontend URL | `http://localhost:3000` |
| `API_URL` | Backend URL | `http://localhost:8000` |

### Frontend (`eventnexus-ai/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000` |

---

## API Reference

All endpoints are prefixed with `/api`. Full interactive docs at `/docs` when the server is running.

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/events/` | List all events (filterable by status, search) |
| `POST` | `/api/events/` | Create a new event |
| `GET` | `/api/events/{id}` | Get event details |

### Organizations
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/organizations/` | List organizations |
| `POST` | `/api/organizations/` | Create organization |
| `GET` | `/api/organizations/{id}` | Get organization details |
| `PUT` | `/api/organizations/{id}` | Update organization |
| `DELETE` | `/api/organizations/{id}` | Delete organization |

### AI & RAG
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/ai/health` | AI subsystem health + backend type |
| `POST` | `/api/ai/networking/recommendations` | Get networking matches for a user |
| `GET` | `/api/ai/rag/snapshot` | Get live DB snapshot (events + attendees + FAQ) |
| `POST` | `/api/ai/rag/chat` | Ask a question — answered from live event data |

### Registration & Tickets
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/registrations/` | Register for an event |
| `GET` | `/api/tickets/` | List tickets |
| `POST` | `/api/tickets/` | Create ticket type |
| `GET` | `/api/waitlist/` | View waitlist entries |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payments/stripe/checkout` | Create Stripe checkout session |
| `POST` | `/api/payments/stripe/webhook` | Handle Stripe webhooks |
| `POST` | `/api/payments/paypal/create` | Create PayPal payment |

---

## AI & RAG System

### How It Works

The platform includes a **Retrieval-Augmented Generation (RAG)** chatbot that answers questions using live event data from MongoDB:

1. **Snapshot Generation** — `GET /api/ai/rag/snapshot` builds a frontend-aligned JSON document from live MongoDB collections (events, registrations → attendees, FAQ)
2. **Document Indexing** — The RAG engine converts the snapshot into searchable documents with metadata
3. **Query Processing** — User questions are matched against documents using either:
   - **SentenceTransformers** (if installed) — semantic cosine similarity via `all-MiniLM-L6-v2`
   - **Token-Jaccard** (fallback) — set-based token overlap similarity
4. **Response** — The best-matching document is returned with source attribution, relevance score, and metadata

### Networking Recommendations

The AI networking engine scores attendee compatibility using a **weighted multi-factor similarity**:

| Factor | Weight | Method |
|--------|--------|--------|
| Interests | 0.30 | Set overlap (Jaccard) |
| Skills | 0.25 | Set overlap |
| Goals | 0.15 | Set overlap |
| Industry | 0.15 | Exact match |
| Role | 0.10 | Complementarity scoring |
| Location | 0.05 | Exact match |

---

## Authentication & RBAC

### Authentication Methods

1. **JWT Bearer Token** — Standard `Authorization: Bearer <token>` header
2. **Dev Header** — For development, send `X-User-Id: <user_id>` to bypass JWT (no token required)

```bash
# Example: Create an organization with dev auth
curl -X POST "http://localhost:8000/api/organizations/" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: u_dev_1" \
  -d '{"name": "Acme Events", "slug": "acme"}'
```

### Role Hierarchy

| Role | Permissions |
|------|------------|
| **Super Admin** | Full platform access, organization management, user management |
| **Organizer** | Create/manage events within their organization, view analytics |
| **Staff** | Manage registrations, check-in attendees, view reports |
| **Attendee** | Register for events, access networking, use AI assistant |

---

## Screenshots

> The platform features a dark-themed, professional UI with responsive design.

### Dashboard Views
- **Organizer Dashboard** — Registration trends, revenue metrics, event cards, AI health status
- **Event Engagement** — Live session management with capacity indicators
- **AI Networking** — Compatibility scores with conversation starters
- **AI Assistant** — Real-time RAG chatbot for event queries
- **Venue Editor** — Interactive floor plan with drag-and-drop elements
- **Badge Designer** — Visual badge creation with QR code embedding

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is part of an academic submission. All rights reserved.

---

<p align="center">
  Built with FastAPI · React · Next.js · MongoDB · AI/RAG
</p>
