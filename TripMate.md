Build a web application called **TripMate** — an AI-powered travel planning assistant. The core experience is a full-screen AI chatbox, similar in look and behavior to ChatGPT, Claude, Gemini, or Grok, but purpose-built for planning trips.

## 1. Core Chat Experience

- On load, show an empty state with a centered headline (e.g. "Where do you want to go?"), a chat input box below it, and a microphone/send icon in the input — mirroring the layout of ChatGPT/Claude's landing screen.
- Below the input, show a row of **rounded suggested-prompt chips/buttons** (like the "Refine Writing / Draft Content / Summarize" buttons in Copilot). Clicking a chip auto-fills or auto-sends that prompt into the chatbox.
- Once a conversation starts, transition into a standard chat thread: user messages right-aligned or highlighted, AI responses streamed token-by-token, markdown rendering (bold, lists, headers, tables) for the AI's replies.
- Persistent left sidebar with "New Chat" button and a scrollable list of past conversations (stored locally or in a database — your choice, but state which one you used).
- Support light and dark themes, defaulting to dark (see attached screenshot for reference styling: dark charcoal background, rounded pill-shaped input, subtle borders).

## 2. Travel-Specific Suggested Prompts

Replace generic productivity chips with travel-focused ones. Include at least these, and feel free to add more or rotate them:

- "Plan a 5-day trip to [destination]"
- "Find budget-friendly destinations for [season/month]"
- "Build a day-by-day itinerary for a family trip to [place]"
- "What should I pack for a trip to [destination]?"
- "Recommend hidden-gem spots in [city]"
- "What documents/visas do I need to travel to [country]?"
- "Suggest a romantic weekend getaway near [location]"
- "Compare [destination A] vs [destination B] for a honeymoon"

Where a chip includes a placeholder like `[destination]`, clicking it should either drop the cursor into the input for the user to fill in, or send a sensible generic version — pick whichever is simpler to implement well.

## 3. AI Integration

- Use the **OpenRouter API** (https://openrouter.ai/api/v1/chat/completions) for the chat backend, using one of their free-tier models (model IDs ending in `:free`, e.g. `meta-llama/llama-3.3-70b-instruct:free` or `deepseek/deepseek-chat-v3-0324:free` — check https://openrouter.ai/models?max_price=0 for the current live list, since free model availability rotates).
- OpenRouter's API is OpenAI-compatible, so use the standard `chat/completions` request/response shape with `stream: true` for streaming responses to the frontend (not returned all at once).
- Make the model ID a config value (e.g. in an env var or constants file) rather than hard-coding it, so it's easy to swap if a free model gets deprecated or rate-limited.
- Give the model a system prompt that establishes it as a friendly, knowledgeable travel planning assistant — it should ask clarifying questions when needed (budget, trip length, travel style, number of travelers) before producing a full itinerary.
- When the AI produces a multi-day itinerary, format it clearly with day headers and structured lists so it's easy to scan, not a wall of text.
- Store the OpenRouter API key (`OPENROUTER_API_KEY`) in an environment variable — never hard-code it. Add basic handling for the free tier's rate limits (roughly 20 requests/min, 50/day by default) — e.g. a friendly error message if a request is rate-limited, rather than a raw API error.

## 4. Tech Stack

Use:
- **Frontend:** Next.js (App Router) + React + TypeScript + Tailwind CSS
- **Backend:** Next.js API routes (or a lightweight Node/Express server if you prefer) proxying requests to the OpenRouter API
- **Persistence:** SQLite (via Prisma or similar) for saving chat history and any saved trips — keep it simple, this doesn't need to be a heavy database
- **Streaming:** Server-sent events, or the Vercel AI SDK's OpenAI-compatible provider pointed at OpenRouter's endpoint, for streaming AI responses to the UI

## 5. Nice-to-Have Features (implement if time allows, otherwise stub/skip)

- Render generated itineraries as structured day-by-day cards instead of plain chat text
- Let users save/bookmark a trip plan from the conversation
- Export a saved itinerary to PDF
- Simple map preview (e.g. embedded static map) showing mentioned destinations

## 6. Deliverables

- A working local dev setup with clear `README.md` instructions (install steps, the `OPENROUTER_API_KEY` env var needed, how to run)
- Clean, componentized code (separate components for ChatInput, MessageList, SuggestedPrompts, Sidebar, etc.)
- Basic loading and error states (e.g. API failure, empty input)
- Responsive layout that works on both desktop and mobile widths

Start by scaffolding the Next.js project and the chat UI shell (empty state + suggested prompts + input), then wire up the streaming Claude API integration, then layer in chat history persistence and the nice-to-have features if time permits.
