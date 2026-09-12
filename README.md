# Journi 🌍 — AI-Powered Travel Planning Assistant

**Journi** is a full-screen, conversational AI travel companion powered by **Joojoo**, inspired by the intuitive design of ChatGPT, Claude, and Grok. Built with Next.js App Router, Tailwind CSS, Prisma 7, SQLite, and OpenRouter's free-tier AI models, Journi helps travelers plan personalized itineraries, uncover hidden local spots, optimize budgets, and travel with confidence.

---

## ✨ Features

- **Full-Screen Conversational Experience**:
  - Centered landing hero (*"Where do you want to go?"*) with rounded pill-shaped input.
  - Travel-tailored suggested prompt chips with category filters (*Itineraries, Budget, Hidden Gems, Packing & Prep, Getaways*).
  - Smooth transition to streaming chat with token-by-token rendering.
  - Rich Markdown support (headings, bold text, bullet lists, and structured comparison tables).

- **Speech-to-Text Voice Dictation**:
  - Built-in microphone button leveraging the Web Speech API so travelers can speak their questions or itineraries hands-free.

- **Persistent Left Sidebar & SQLite Storage**:
  - Local database persistence using SQLite and Prisma 7.
  - Automatic conversation titling based on destination or intent.
  - Chronological chat history with inline renaming and deletion.
  - Keyboard shortcut: `Ctrl + K` / `Cmd + K` for a new chat.

- **Interactive Day-by-Day Itinerary Cards**:
  - Automatically parses multi-day itineraries into visual cards with **Morning** (🌅), **Afternoon** (☀️), and **Evening** (🌙) breakdown cards.
  - One-click toggle between Markdown view and Card view.

- **Saved Trips & Bookmarks**:
  - Bookmark any generated itinerary directly from the message toolbar.
  - Dedicated "Saved Itineraries" drawer with search, print, and jump-to-chat capabilities.

- **PDF Export & Print Mode**:
  - Clean print stylesheet to export customized itineraries directly to PDF or paper.

- **Destination Map Preview**:
  - Integrated OpenStreetMap preview modal for visual exploration of recommended destinations.

- **Dark & Light Themes**:
  - Defaults to dark theme (dark charcoal background `#121214`, rounded cards `#1e1e22`, subtle borders `#2e2e34`).
  - Toggle between dark and light themes anytime.

- **OpenRouter Free Tier & Multi-Model Switching**:
  - Powered by OpenRouter's free tier models (e.g., `nvidia/nemotron-3.5-lightning:free`, `nex-agi/nex-n2.5-pro:free`, `google/gemma-4-31b-it:free`).
  - Friendly rate-limit (429) handling and fallback messaging.
  - Easy-to-switch model selector in the sidebar.

---

## 🛠️ Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (App Router, React 19, TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Markdown & Tables**: `react-markdown` + `remark-gfm`
- **Database & Persistence**: [SQLite](https://www.sqlite.org/) via [Prisma ORM 7](https://www.prisma.io/) + `@prisma/adapter-better-sqlite3`
- **AI Backend**: [OpenRouter API](https://openrouter.ai/) streaming completions

---

## 🚀 Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) v20.19.0 or later (v22 recommended)
- `npm` (or `pnpm` / `yarn`)

### 2. Installation

Clone or navigate into the repository directory and install dependencies:

```bash
npm install
```

### 3. Environment Variables

TripMate requires an OpenRouter API key. Create or edit `.env` in the root of the project:

```env
# Database connection
DATABASE_URL="file:./dev.db"

# OpenRouter API Key (Get a free key at https://openrouter.ai/keys)
OPENROUTER_API_KEY="sk-or-v1-your-key-here"

# Default Model (Free Tier)
OPENROUTER_MODEL="nvidia/nemotron-3.5-lightning:free"
```

> **Note on Free Models**:
> OpenRouter free model availability occasionally rotates. You can browse live free models at [openrouter.ai/models?max_price=0](https://openrouter.ai/models?max_price=0) and change the model via the UI model picker or by modifying `OPENROUTER_MODEL` in `.env`.

### 4. Database Setup

Synchronize the SQLite database schema and generate the Prisma 7 client:

```bash
npx prisma db push
npx prisma generate
```

This creates the local `dev.db` file with `Conversation`, `Message`, and `SavedTrip` tables.

### 5. Run Development Server

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 📁 Project Architecture

```
TripMate/
├── prisma/
│   └── schema.prisma          # Database models (Conversation, Message, SavedTrip)
├── prisma7.config.ts          # Prisma 7 CLI configuration
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/          # Streaming OpenRouter chat route with SQLite persistence
│   │   │   ├── conversations/ # Conversation listing, fetching, renaming, deleting
│   │   │   └── trips/         # Saved/bookmarked trips management
│   │   ├── globals.css        # Tailwind v4 theme variables, dark mode, print styles
│   │   ├── layout.tsx         # Root layout with dark mode default & Geist typography
│   │   └── page.tsx           # Main application shell with empty state & chat threads
│   ├── components/
│   │   ├── ChatInput.tsx      # Rounded pill input with auto-resize & speech recognition
│   │   ├── ItineraryCardView.tsx # Day-by-day structured card timeline parser
│   │   ├── MapModal.tsx       # Embedded OpenStreetMap preview modal
│   │   ├── MessageItem.tsx    # Message bubble, markdown renderer & action toolbar
│   │   ├── MessageList.tsx    # Scrollable thread with auto-scroll
│   │   ├── SavedTripsModal.tsx # Bookmarked itinerary manager with PDF export
│   │   ├── Sidebar.tsx        # Responsive navigation drawer & model selector
│   │   ├── SuggestedPrompts.tsx # Travel chips with category filters
│   │   └── ThemeToggle.tsx    # Dark / Light theme toggle
│   ├── lib/
│   │   ├── openrouter.ts      # Model definitions & TripMate travel system prompt
│   │   └── prisma.ts          # Singleton PrismaClient with better-sqlite3 adapter
│   └── types/
│       └── chat.ts            # TypeScript interfaces
└── README.md
```

---

## 🧪 Testing & Verification

- **Type Check**: `npx tsc --noEmit`
- **Production Build**: `npm run build`
- **Linting**: `npm run lint`

---

## 📜 License

MIT License. Designed and built with ❤️ for travelers everywhere.
"# Journi" 
"# Journi" 
