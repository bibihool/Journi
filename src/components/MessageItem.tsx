"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  Compass,
  User,
  Copy,
  Check,
  Bookmark,
  MapPin,
  Calendar,
  Printer,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatMessage } from "@/types/chat";
import { ItineraryCardView } from "./ItineraryCardView";

interface MessageItemProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onOpenMap?: (destination: string) => void;
  conversationId?: string;
  conversationTitle?: string;
}

export function MessageItem({
  message,
  isStreaming,
  onOpenMap,
  conversationId,
  conversationTitle,
}: MessageItemProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCardView, setShowCardView] = useState(false);

  // Detect if this message has day-by-day itinerary sections
  const hasItineraryDays = useMemo(() => {
    if (isUser) return false;
    return /(?:#{1,4}\s*)?(?:\*\*)?Day\s*\d+[:\s–—-]+/i.test(message.content);
  }, [message.content, isUser]);

  // Try to extract destination from the message content
  const detectedDestination = useMemo(() => {
    if (isUser) return "";
    const match = message.content.match(
      /(?:trip to|itinerary for|visiting|explore|guide to|welcome to)\s+([A-Z][a-zA-Z\s]{2,20})/i
    );
    if (match && match[1]) {
      return match[1].trim();
    }
    // Fallback: check conversation title
    if (conversationTitle && conversationTitle.toLowerCase().includes("trip to ")) {
      return conversationTitle.replace(/trip to /i, "").trim();
    }
    return "Destination";
  }, [message.content, isUser, conversationTitle]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSaveTrip = async () => {
    if (saved || saving) return;
    setSaving(true);
    try {
      const title =
        detectedDestination !== "Destination"
          ? `${detectedDestination} Itinerary`
          : conversationTitle || "Saved Trip Plan";

      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          destination: detectedDestination !== "Destination" ? detectedDestination : null,
          itinerary: message.content,
          conversationId,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3500);
      }
    } catch (err) {
      console.error("Failed to save trip", err);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end w-full max-w-3xl mx-auto my-3 px-4">
        <div className="flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%]">
          <div className="rounded-2xl px-4 py-2.5 bg-blue-600 text-white shadow-md text-sm sm:text-base leading-relaxed break-words">
            {message.content}
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-700/30 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/20">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start w-full max-w-3xl mx-auto my-4 px-4">
      <div className="flex items-start gap-3 w-full">
        {/* Assistant Avatar (Joojoo) */}
        <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-md border border-zinc-200 dark:border-zinc-700/60 shrink-0 mt-1">
          <Image
            src="/animal.png"
            alt="Joojoo"
            width={32}
            height={32}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Message Bubble & Markdown Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
              Joojoo
            </span>
            <span className="text-[10px] text-zinc-400">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="rounded-2xl p-4 sm:p-5 bg-white dark:bg-[#19191d] border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs text-sm sm:text-base leading-relaxed text-zinc-800 dark:text-zinc-200 overflow-x-auto">
            {showCardView && hasItineraryDays ? (
              <ItineraryCardView
                content={message.content}
                onClose={() => setShowCardView(false)}
              />
            ) : (
              <div className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-h3:text-blue-500 prose-a:text-blue-500 prose-table:border-collapse prose-th:border prose-th:border-zinc-300 dark:prose-th:border-zinc-700 prose-th:p-2 prose-td:border prose-td:border-zinc-300 dark:prose-td:border-zinc-700 prose-td:p-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>

                {isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse align-middle" />
                )}
              </div>
            )}
          </div>

          {/* Action Toolbar for Assistant Response */}
          {!isStreaming && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2 px-1">
              {/* Copy button */}
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
                title="Copy response to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {/* Bookmark / Save Trip button */}
              <button
                type="button"
                onClick={handleSaveTrip}
                disabled={saved || saving}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg transition-colors ${
                  saved
                    ? "text-amber-500 bg-amber-500/10 font-medium"
                    : "text-zinc-500 hover:text-amber-500 hover:bg-amber-500/10"
                }`}
                title="Save itinerary to Bookmarked Trips"
              >
                <Bookmark
                  className={`w-3.5 h-3.5 ${saved ? "fill-current" : ""}`}
                />
                <span>{saved ? "Trip Saved!" : saving ? "Saving..." : "Save Trip"}</span>
              </button>

              {/* Itinerary Card View Toggle (if days detected) */}
              {hasItineraryDays && (
                <button
                  type="button"
                  onClick={() => setShowCardView(!showCardView)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg transition-colors ${
                    showCardView
                      ? "text-blue-500 bg-blue-500/10 font-medium"
                      : "text-zinc-500 hover:text-blue-500 hover:bg-blue-500/10"
                  }`}
                  title="Toggle structured day cards"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{showCardView ? "Markdown View" : "Day Cards"}</span>
                </button>
              )}

              {/* Map Preview button */}
              {onOpenMap && (
                <button
                  type="button"
                  onClick={() => onOpenMap(detectedDestination)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                  title="Open map preview"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Map</span>
                </button>
              )}

              {/* Print / PDF Export */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
                title="Print or Export to PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
