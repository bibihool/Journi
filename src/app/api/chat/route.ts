import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MODEL, JOURNI_SYSTEM_PROMPT } from "@/lib/openrouter";

export const runtime = "nodejs";

import { generateConversationTitle } from "@/lib/title";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      conversationId: incomingConvId,
      messages = [],
      model = DEFAULT_MODEL,
    } = body;

    const apiKey = process.env.OPENROUTER_API_KEY;

    // Get the latest user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !lastMessage.content) {
      return new Response(
        JSON.stringify({ error: "No message content provided." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Determine or create Conversation in database and track active title
    let activeConvId = incomingConvId;
    let activeTitle = "New Trip";

    if (!activeConvId) {
      activeTitle = generateConversationTitle(lastMessage.content);
      const newConv = await prisma.conversation.create({
        data: {
          title: activeTitle,
        },
      });
      activeConvId = newConv.id;
    } else {
      const existing = await prisma.conversation.findUnique({
        where: { id: activeConvId },
      });
      if (existing) {
        if (existing.title === "New Trip") {
          activeTitle = generateConversationTitle(lastMessage.content);
          await prisma.conversation.update({
            where: { id: activeConvId },
            data: { title: activeTitle },
          });
        } else {
          activeTitle = existing.title;
        }
      }
    }

    // Persist the user's message to DB
    await prisma.message.create({
      data: {
        conversationId: activeConvId,
        role: "user",
        content: lastMessage.content,
      },
    });

    if (!apiKey) {
      const fallbackResponse = `### Welcome to Journi! 🌍
I'm **Joojoo**, your AI travel assistant.

It looks like the \`OPENROUTER_API_KEY\` environment variable has not been configured in your \`.env\` file yet.

**To enable live AI generation with Joojoo:**
1. Visit [OpenRouter](https://openrouter.ai/keys) to get a free API key.
2. Add your key in the \`.env\` file:
   \`\`\`env
   OPENROUTER_API_KEY="your-openrouter-key-here"
   \`\`\`
3. Restart the dev server (\`npm run dev\`).

In the meantime, your conversation has been saved to SQLite! You can ask questions once your key is connected.`;

      // Save assistant message
      await prisma.message.create({
        data: {
          conversationId: activeConvId,
          role: "assistant",
          content: fallbackResponse,
        },
      });

      // Stream fallback response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: fallbackResponse })}\n\n`)
          );
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                conversationId: activeConvId,
                title: activeTitle,
              })}\n\n`
            )
          );
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "x-conversation-id": activeConvId,
          "x-conversation-title": encodeURIComponent(activeTitle),
        },
      });
    }

    // Format chat messages including Joojoo system prompt
    const openRouterMessages = [
      { role: "system", content: JOURNI_SYSTEM_PROMPT },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Request OpenRouter streaming API
    const openRouterRes = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Journi Travel Planner",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model || DEFAULT_MODEL,
          messages: openRouterMessages,
          stream: true,
        }),
      }
    );

    // Handle OpenRouter errors gracefully
    if (!openRouterRes.ok) {
      const errorText = await openRouterRes.text();
      let friendlyError = "An unexpected error occurred while contacting OpenRouter.";

      if (openRouterRes.status === 429) {
        friendlyError = `⚠️ **OpenRouter Free Tier Rate Limit Reached**
The selected free model has temporarily hit its rate limit (usually 20 requests/minute or 50/day).

**What you can do:**
- Wait 30-60 seconds and try again.
- Switch to another available free model from the model selector in the sidebar.
- Add credits to your OpenRouter account for higher priority throughput.`;
      } else if (openRouterRes.status === 401) {
        friendlyError = "⚠️ **Invalid OpenRouter API Key**. Please check that your key in `.env` is correct and active.";
      } else {
        friendlyError = `⚠️ **OpenRouter Error (${openRouterRes.status})**: ${errorText || openRouterRes.statusText}`;
      }

      // Persist the error as an assistant message
      await prisma.message.create({
        data: {
          conversationId: activeConvId,
          role: "assistant",
          content: friendlyError,
        },
      });

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: friendlyError })}\n\n`)
          );
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                conversationId: activeConvId,
                title: activeTitle,
              })}\n\n`
            )
          );
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "x-conversation-id": activeConvId,
          "x-conversation-title": encodeURIComponent(activeTitle),
        },
      });
    }

    const openRouterBody = openRouterRes.body;
    if (!openRouterBody) {
      throw new Error("No response body received from OpenRouter.");
    }

    const reader = openRouterBody.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let accumulatedContent = "";

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data:")) continue;

              const dataPayload = trimmed.slice(5).trim();
              if (dataPayload === "[DONE]") continue;

              try {
                const parsed = JSON.parse(dataPayload);
                const deltaContent = parsed.choices?.[0]?.delta?.content;
                if (deltaContent) {
                  accumulatedContent += deltaContent;
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ text: deltaContent })}\n\n`
                    )
                  );
                }
              } catch {
                // Ignore SSE keepalives or non-JSON payloads
              }
            }
          }

          // Persist the full assistant response to the SQLite database
          if (accumulatedContent.trim()) {
            await prisma.message.create({
              data: {
                conversationId: activeConvId,
                role: "assistant",
                content: accumulatedContent,
              },
            });
          }

          // Emit the done event with active conversation ID and updated title
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                conversationId: activeConvId,
                title: activeTitle,
              })}\n\n`
            )
          );
          controller.close();
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: `Stream interrupted: ${errMsg}`,
                done: true,
                conversationId: activeConvId,
                title: activeTitle,
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "x-conversation-id": activeConvId,
        "x-conversation-title": encodeURIComponent(activeTitle),
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
