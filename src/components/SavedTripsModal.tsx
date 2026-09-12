"use client";

import { useState, useEffect } from "react";
import {
  X,
  Bookmark,
  Trash2,
  Printer,
  Calendar,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { SavedTrip } from "@/types/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SavedTripsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation?: (conversationId: string) => void;
}

export function SavedTripsModal({
  isOpen,
  onClose,
  onSelectConversation,
}: SavedTripsModalProps) {
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<SavedTrip | null>(null);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/trips");
      if (res.ok) {
        const data = await res.json();
        setTrips(data);
        if (data.length > 0 && !selectedTrip) {
          setSelectedTrip(data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load saved trips", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTrips();
    }
  }, [isOpen]);

  const handleDeleteTrip = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this saved trip?")) return;

    try {
      const res = await fetch(`/api/trips/${id}`, { method: "DELETE" });
      if (res.ok) {
        const remaining = trips.filter((t) => t.id !== id);
        setTrips(remaining);
        if (selectedTrip?.id === id) {
          setSelectedTrip(remaining[0] || null);
        }
      }
    } catch (err) {
      console.error("Failed to delete trip", err);
    }
  };

  const handlePrintTrip = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs">
      <div className="relative flex flex-col w-full max-w-4xl h-[85vh] rounded-2xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Bookmark className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Saved Trips & Itineraries
              </h2>
              <p className="text-xs text-zinc-500">
                {trips.length} saved {trips.length === 1 ? "plan" : "plans"} in SQLite
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedTrip && (
              <button
                onClick={handlePrintTrip}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
                title="Export or Print Itinerary"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            )}
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Column: Trip List */}
          <div className="w-full sm:w-72 md:w-80 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto p-3 space-y-2 shrink-0">
            {loading ? (
              <div className="py-12 text-center text-xs text-zinc-400">
                Loading saved itineraries...
              </div>
            ) : trips.length === 0 ? (
              <div className="py-12 text-center px-4">
                <Bookmark className="w-8 h-8 mx-auto text-zinc-400 opacity-40 mb-2" />
                <p className="text-xs text-zinc-500 font-medium">
                  No saved trips yet.
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Click &ldquo;Save Trip&rdquo; on any itinerary generated in chat to bookmark it here.
                </p>
              </div>
            ) : (
              trips.map((trip) => {
                const isSelected = selectedTrip?.id === trip.id;
                return (
                  <div
                    key={trip.id}
                    onClick={() => setSelectedTrip(trip)}
                    className={`group relative flex flex-col p-3 rounded-xl cursor-pointer border transition-all text-left ${
                      isSelected
                        ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-zinc-900 dark:text-zinc-100"
                        : "bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold line-clamp-1">
                        {trip.title}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTrip(trip.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-opacity"
                        title="Delete saved trip"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-400">
                      {trip.destination && (
                        <span className="flex items-center gap-0.5 truncate">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          {trip.destination}
                        </span>
                      )}
                      <span className="flex items-center gap-0.5 ml-auto shrink-0">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(trip.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Selected Trip Detail View */}
          <div className="hidden sm:flex flex-1 flex-col overflow-y-auto p-6 bg-white dark:bg-[#151518]">
            {selectedTrip ? (
              <div className="space-y-4 print-only-container">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{selectedTrip.destination || "Trip Itinerary"}</span>
                  </div>
                  <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                    {selectedTrip.title}
                  </h1>
                  <p className="text-xs text-zinc-400 mt-1">
                    Saved on {new Date(selectedTrip.createdAt).toLocaleDateString()}
                  </p>

                  {selectedTrip.conversationId && onSelectConversation && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectConversation(selectedTrip.conversationId!);
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-500 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Jump to original chat thread
                    </button>
                  )}
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedTrip.itinerary}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-zinc-400">
                Select a trip from the left to view its itinerary.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
