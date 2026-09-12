"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Sparkles, Bookmark } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { ChatInput } from "@/components/ChatInput";
import { SuggestedPrompts } from "@/components/SuggestedPrompts";
import { MessageList } from "@/components/MessageList";
import { MapModal } from "@/components/MapModal";
import { SavedTripsModal } from "@/components/SavedTripsModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChatMessage, ConversationSummary } from "@/types/chat";
import { DEFAULT_MODEL, FREE_MODELS } from "@/lib/openrouter";
import { generateConversationTitle } from "@/lib/title";

export default function Home() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversationTitle, setActiveConversationTitle] = useState<string>("New Trip");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);

  // Modals & responsive drawer states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [savedTripsOpen, setSavedTripsOpen] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mapDestination, setMapDestination] = useState("Tokyo");

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load conversations list on mount
  const loadConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error("Failed to load conversations", err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K for new chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Select and load a conversation from sidebar
  const handleSelectConversation = async (id: string) => {
    if (isStreaming) {
      handleStopStreaming();
    }

    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveConversationId(data.id);
        setActiveConversationTitle(data.title);
        setMessages(
          data.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch conversation details", err);
    }
  };

  // Start a fresh conversation
  const handleNewChat = () => {
    if (isStreaming) {
      handleStopStreaming();
    }
    setActiveConversationId(null);
    setActiveConversationTitle("New Trip");
    setMessages([]);
    setInput("");
  };

  // Rename a conversation
  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
        );
        if (activeConversationId === id) {
          setActiveConversationTitle(newTitle);
        }
      }
    } catch (err) {
      console.error("Failed to rename conversation", err);
    }
  };

  // Delete a conversation
  const handleDeleteConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConversationId === id) {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error("Failed to delete conversation", err);
    }
  };

  // Stop streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Send message to OpenRouter API
  const handleSendMessage = async (userPrompt: string) => {
    const trimmed = userPrompt.trim();
    if (!trimmed || isStreaming) return;

    // Reset input
    setInput("");

    // Optimistically update the chat name in the header if it was "New Trip"
    if (!activeConversationId || activeConversationTitle === "New Trip") {
      const optimisticTitle = generateConversationTitle(trimmed);
      setActiveConversationTitle(optimisticTitle);
    }

    // Create optimistic user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      createdAt: new Date(),
    };

    // Placeholder for streaming assistant response
    const assistantMsgId = `assistant-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      createdAt: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages([...updatedMessages, assistantMsg]);
    setIsStreaming(true);

    // Setup abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId,
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: selectedModel,
        }),
        signal: controller.signal,
      });

      // Update conversation ID and Title from response headers
      const returnedConvId = res.headers.get("x-conversation-id");
      if (returnedConvId && !activeConversationId) {
        setActiveConversationId(returnedConvId);
      }

      const returnedTitle = res.headers.get("x-conversation-title");
      if (returnedTitle) {
        setActiveConversationTitle(decodeURIComponent(returnedTitle));
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream available.");

      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith("data:")) continue;

          const jsonPayload = trimmedLine.slice(5).trim();
          try {
            const data = JSON.parse(jsonPayload);

            if (data.text) {
              accumulatedText += data.text;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: accumulatedText }
                    : msg
                )
              );
            }

            if (data.done) {
              if (data.conversationId) {
                setActiveConversationId(data.conversationId);
              }
              if (data.title) {
                setActiveConversationTitle(data.title);
              }
            }
          } catch {
            // Ignore parse errors on ping lines
          }
        }
      }

      // Refresh sidebar conversations to show the new conversation / title
      loadConversations();
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Stream aborted by user.");
      } else {
        const errMessage = err.message || "Failed to get response.";
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: `⚠️ **Joojoo Error**: ${errMessage}\n\nPlease check your internet connection or try again in a few moments.`,
                }
              : msg
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Open map for a destination
  const handleOpenMap = (destination: string) => {
    setMapDestination(destination);
    setMapModalOpen(true);
  };

  const isThreadEmpty = messages.length === 0;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* Left Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onOpenSavedTrips={() => setSavedTripsOpen(true)}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
      />

      {/* Main Chat Pane */}
      <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden relative">
        {/* Top Navbar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-[#121215]/50 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[220px] sm:max-w-md">
                {isThreadEmpty ? "Journi Planner" : activeConversationTitle}
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                {FREE_MODELS.find((m) => m.id === selectedModel)?.name || "Nemotron 3.5"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSavedTripsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-zinc-100 dark:bg-zinc-800/70 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
              title="View saved itineraries"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Saved Trips</span>
            </button>

            <button
              type="button"
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
              title="Start a new chat"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>

            <div className="md:hidden">
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Chat Thread / Empty State */}
        <div className="flex-1 overflow-y-auto flex flex-col justify-between">
          {isThreadEmpty ? (
            /* Empty State Landing Screen */
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-3xl mx-auto w-full text-center my-auto">
              {/* Badge & Icon */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-4 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>AI-POWERED TRAVEL ADVISOR</span>
              </div>

              {/* Centered Headline */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3">
                Where do you want to go?
              </h2>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-xl mb-8 leading-relaxed">
                Journi crafts tailored day-by-day itineraries, finds budget-friendly getaways, suggests local hidden gems, and answers any travel question with Joojoo.
              </p>

              {/* Centered Chat Input Box */}
              <div className="w-full">
                <ChatInput
                  input={input}
                  setInput={setInput}
                  onSend={handleSendMessage}
                  isStreaming={isStreaming}
                  onStop={handleStopStreaming}
                  placeholder="Where would you like to travel? (e.g. 5 days in Tokyo on a budget)"
                />
              </div>

              {/* Suggested Travel Prompts below Input */}
              <div className="w-full mt-4">
                <SuggestedPrompts
                  onSelectPrompt={(promptText) => {
                    handleSendMessage(promptText);
                  }}
                />
              </div>
            </div>
          ) : (
            /* Active Message Thread */
            <div className="flex-1 flex flex-col overflow-hidden">
              <MessageList
                messages={messages}
                isStreaming={isStreaming}
                onOpenMap={handleOpenMap}
                conversationId={activeConversationId || undefined}
                conversationTitle={activeConversationTitle}
              />

              {/* Floating Bottom Input Bar */}
              <div className="p-4 bg-linear-to-t from-[var(--background)] via-[var(--background)] to-transparent pt-6 shrink-0">
                <ChatInput
                  input={input}
                  setInput={setInput}
                  onSend={handleSendMessage}
                  isStreaming={isStreaming}
                  onStop={handleStopStreaming}
                />
                <p className="text-[11px] text-center text-zinc-400 dark:text-zinc-500 mt-2">
                  Journi • Powered by Joojoo via OpenRouter • SQLite local persistence
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Preview Modal */}
      <MapModal
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        destination={mapDestination}
      />

      {/* Saved Trips Drawer / Modal */}
      <SavedTripsModal
        isOpen={savedTripsOpen}
        onClose={() => setSavedTripsOpen(false)}
        onSelectConversation={(convId) => {
          handleSelectConversation(convId);
        }}
      />
    </div>
  );
}
