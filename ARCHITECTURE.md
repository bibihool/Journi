# Journi — System Architecture & Technology Stack

This document details the system architecture, component layers, design decisions, constraints, and operational characteristics of **Journi**, an AI-powered travel planning web application.

---

## 1. System Architecture Diagram

```mermaid
flowchart TB
    subgraph Client["Client Tier (User Browser)"]
        UI["Journi UI (React 19 + Tailwind v4)"]
        Voice["Web Speech API (Voice Dictation)"]
        Storage["LocalStorage (Theme & Settings)"]
        MapEmbed["OpenStreetMap Preview (Iframe)"]
    end

    subgraph CDN["Edge & Delivery Tier (Vercel)"]
        Edge["Vercel Global Edge Network (CDN)"]
        Static["Static Assets (animal.png, favicon.jpeg, JS/CSS)"]
    end

    subgraph Compute["Serverless Backend Tier (Next.js 16 App Router)"]
        ChatRoute["POST /api/chat (SSE Stream Proxy)"]
        ConvRoute["/api/conversations (CRUD API)"]
        TripRoute["/api/trips (Bookmarks API)"]
        TitleGen["Title Generator & Parsing Engine"]
    end

    subgraph Persistence["Persistence Tier (SQLite + Prisma 7)"]
        Prisma["Prisma ORM 7 (@prisma/client)"]
        Adapter["PrismaBetterSqlite3 Adapter"]
        SQLiteDB[("SQLite Database (/tmp/dev.db)")]
        TemplateDB[("Template Database (prisma/template.db)")]
    end

    subgraph External["External Services & Providers"]
        OpenRouter["OpenRouter API (Free Tier Models)"]
        OSM["OpenStreetMap Public Tiles"]
        GitHub["GitHub (VCS & CI/CD Pipeline)"]
    end

    %% Client Interactions
    UI -->|HTTPS Request| Edge
    UI -->|Voice Input| Voice
    UI -->|User Preferences| Storage
    UI -->|Embed Location| MapEmbed
    MapEmbed -.->|Tile Requests| OSM

    %% Edge Routing
    Edge -->|Cache Hit| Static
    Edge -->|Dynamic Route| Compute

    %% Backend Execution
    ChatRoute -->|1. Generate Title| TitleGen
    ChatRoute -->|2. Stream LLM Request| OpenRouter
    OpenRouter -.->|Token Chunks (SSE)| ChatRoute
    ChatRoute -.->|Server-Sent Events| UI

    %% Database Operations
    ChatRoute -->|Persist Chat| Prisma
    ConvRoute -->|Query / Update History| Prisma
    TripRoute -->|Save Itinerary| Prisma
    Prisma --> Adapter
    Adapter --> SQLiteDB
    TemplateDB -.->|Runtime Init Copy| SQLiteDB

    %% Deployment flow
    GitHub -->|Git Push Hook| Edge
```

---

## 2. Technology Stack Breakdown

### A. Frontend Layer

| Component | Technology |
|---|---|
| **Framework** | Next.js 16.3 (App Router) + React 19 |
| **Language** | TypeScript 5.9 |
| **Styling** | Tailwind CSS v4 |
| **Icons** | Lucide React |
| **Markdown Rendering** | `react-markdown` + `remark-gfm` |

#### Why This Was Chosen:
- **Next.js App Router & React 19**: Provides seamless streaming response handling (`ReadableStream`), instant hydration, and modular component architecture. Allows clean separation between server components and interactive client components (`ChatInput`, `MessageList`, `Sidebar`).
- **Tailwind CSS v4**: Utility-first CSS engine with zero runtime overhead. CSS variable theming enables high-contrast dark mode as the default (`#121214` charcoal background, subtle `#2e2e34` borders) with a toggle for light mode.
- **`react-markdown` & `remark-gfm`**: Enables rich rendering of AI responses, including day-by-day headers, bold attraction names, travel tips, and markdown comparison tables.
- **Web Speech API**: Browser-native voice dictation allowing travelers to speak their travel queries hands-free without third-party audio API fees.

#### Expected Constraints & Trade-Offs:
1. **High-Frequency Re-renders During Streaming**: Real-time token streaming triggers continuous re-rendering. *Mitigation*: Messages are isolated by ID, and auto-scrolling is debounced to the active streaming bubble.
2. **Browser Compatibility for Voice Dictation**: The Web Speech API is natively supported in Chromium (Chrome, Edge) and Safari, but not in Firefox. *Mitigation*: Graceful error alerts when the feature is unavailable.

---

### B. Backend Layer

| Component | Technology |
|---|---|
| **Runtime** | Node.js 22 (Serverless Route Handlers) |
| **API Protocol** | REST + Server-Sent Events (SSE) |
| **Streaming Mechanism** | Web Standard `ReadableStream` & `TextEncoder` |

#### Why This Was Chosen:
- **Unified Fullstack Next.js**: Consolidates API route handlers and frontend views in a single repository, sharing TypeScript interfaces (`ChatMessage`, `ConversationSummary`, `SavedTrip`).
- **Native Streaming via Server-Sent Events (SSE)**: Instead of buffering full AI answers, tokens are streamed to the client the millisecond they are received from OpenRouter, minimizing Time to First Token (TTFT).
- **Security & Secret Isolation**: Server-side proxying prevents `OPENROUTER_API_KEY` from ever leaking to client browser network requests.

#### Expected Constraints & Trade-Offs:
1. **Serverless Execution Limits**: Vercel Hobby tier caps function execution time to 15–60 seconds. For multi-day itineraries from slower models, long streaming queries could risk timeout. *Mitigation*: Free-tier models selected for high throughput (`nemotron-3.5-lightning` delivers ~80+ tokens/sec).
2. **Stateless Functions**: Serverless backends do not share memory across concurrent requests. *Mitigation*: All conversation state is persisted immediately to the SQLite database upon stream completion.

---

### C. Database & Persistence Layer

| Component | Technology |
|---|---|
| **ORM** | Prisma ORM 7.10 |
| **Database Engine** | SQLite (Embedded local database) |
| **Driver Adapter** | `@prisma/adapter-better-sqlite3` + `better-sqlite3` |
| **Runtime Location** | `/tmp/dev.db` (Serverless) / `./dev.db` (Local) |

#### Why This Was Chosen:
- **Zero Infrastructure Cost**: SQLite requires no dedicated database servers, connection pooling services, or monthly fees.
- **Prisma 7 ORM**: Provides strict TypeScript types for all models (`Conversation`, `Message`, `SavedTrip`), automated schema synchronization via `prisma db push`, and the new Prisma 7 driver adapter architecture.
- **Template Initialization Pattern**: Because Vercel serverless containers have read-only filesystems except for `/tmp`, Journi includes a pre-seeded `prisma/template.db` that is automatically initialized into `/tmp/dev.db` on first execution.

#### Expected Constraints & Trade-Offs:
1. **Serverless Ephemerality**: Vercel serverless instances are ephemeral. While SQLite runs with full read/write access in `/tmp`, container recycling will periodically reset local chat history.
2. **Write Concurrency**: SQLite uses file-level write locking. While ideal for personal use, high concurrent write loads can trigger `SQLITE_BUSY`.
3. **Upgrade Path**: When scaling to thousands of multi-user concurrent travelers, the schema can be switched to a managed serverless cloud database like **Turso** (distributed SQLite / libSQL) or **Neon / Supabase** (PostgreSQL) by changing only the Prisma provider string.

---

### D. External APIs & Third-Party Services

| Service | Role |
|---|---|
| **OpenRouter API** | AI chat completions proxy providing free-tier LLMs |
| **OpenStreetMap** | Destination map embeds |
| **GitHub** | Version control & automated CI/CD trigger |

#### Why This Was Chosen:
- **OpenRouter API**: Aggregates state-of-the-art open models (`nvidia/nemotron-3.5-lightning:free` with 1M context, `nex-agi/nex-n2.5-pro:free`, `google/gemma-4-31b-it:free`) under a unified OpenAI-compatible endpoint with streaming support.
- **OpenStreetMap**: Free, open-source iframe map embedding that requires no API keys, billing accounts, or rate quota tracking.

#### Expected Constraints & Trade-Offs:
1. **Free-Tier Rate Limits**: OpenRouter free models typically enforce rate limits (~20 requests/min, 50–200 requests/day). *Mitigation*: Custom error interceptors detect HTTP 429 and present helpful, friendly notices with model-switching suggestions.
2. **Rotating Free Model Availability**: OpenRouter rotates free models periodically. *Mitigation*: The model identifier is dynamically configurable via `OPENROUTER_MODEL` in `.env` and selectable in the UI sidebar without modifying application code.

---

### E. Hosting & Deployment Infrastructure

| Layer | Provider |
|---|---|
| **Hosting Platform** | [Vercel](https://vercel.com) |
| **Deployment URL** | `https://journi-umber.vercel.app` |
| **Continuous Delivery** | Automatic GitHub webhook pipeline (`main` branch) |
| **CDN / Edge Network** | Vercel Global Edge Network with automated SSL |

#### Why This Was Chosen:
- **Optimized for Next.js**: Vercel provides automatic build optimization, edge routing, image optimization, and instantaneous global asset delivery.
- **Zero-Config CI/CD**: Every `git push origin main` triggers automated compilation, Prisma generation, and atomic zero-downtime deployment.

#### Expected Constraints & Trade-Offs:
1. **Read-Only Container Filesystem**: Resolved by directing runtime database writes to `/tmp/dev.db` and marking `better-sqlite3` as a `serverExternalPackage` in `next.config.ts`.
2. **Cold Starts**: Infrequently used serverless routes may experience a slight 1–2 second initial startup delay.
