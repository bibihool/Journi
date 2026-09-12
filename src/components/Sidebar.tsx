"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Plus,
  MessageSquare,
  Bookmark,
  Trash2,
  Edit2,
  Check,
  X,
  Compass,
  ChevronDown,
  Cpu,
} from "lucide-react";
import { ConversationSummary } from "@/types/chat";
import { ThemeToggle } from "./ThemeToggle";
import { FREE_MODELS, OpenRouterModelOption } from "@/lib/openrouter";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onOpenSavedTrips: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export function Sidebar({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onOpenSavedTrips,
  selectedModel,
  onSelectModel,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showModelPicker, setShowModelPicker] = useState(false);

  const startRename = (conv: ConversationSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const currentModel =
    FREE_MODELS.find((m) => m.id === selectedModel) || FREE_MODELS[0];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 flex flex-col bg-[#141416] dark:bg-[#0f0f11] text-zinc-300 border-r border-zinc-800/80 transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Sidebar Header / Brand */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-md border border-zinc-700/60 shrink-0">
              <Image
                src="/favicon.jpeg"
                alt="Journi"
                width={32}
                height={32}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">
                Journi
              </h1>
              <p className="text-[10px] text-zinc-400 font-medium">
                AI Travel Planner
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons: New Chat & Saved Trips */}
        <div className="p-3 space-y-2">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-md shadow-blue-600/20 group"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
              <span>New Trip</span>
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-500/40 text-blue-100 font-mono">
              Ctrl+K
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenSavedTrips();
              if (window.innerWidth < 768) onClose();
            }}
            className="flex items-center gap-2 w-full px-3.5 py-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium border border-zinc-700/50 transition-colors"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span>Saved Itineraries</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Recent Trips
          </div>

          {conversations.length === 0 ? (
            <div className="py-8 px-4 text-center">
              <MessageSquare className="w-6 h-6 mx-auto text-zinc-600 mb-2" />
              <p className="text-xs text-zinc-500">No past trips found.</p>
              <p className="text-[11px] text-zinc-600 mt-1">
                Start chatting to plan a new journey!
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = activeConversationId === conv.id;
              const isEditing = editingId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                    isActive
                      ? "bg-zinc-800 text-white font-medium shadow-xs"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? "text-blue-400" : "text-zinc-500"
                      }`}
                    />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveRename(conv.id, e as any);
                          if (e.key === "Escape") cancelRename(e as any);
                        }}
                        autoFocus
                        className="w-full bg-zinc-900 text-zinc-100 text-xs px-1.5 py-0.5 rounded border border-blue-500 outline-none"
                      />
                    ) : (
                      <span className="truncate">{conv.title}</span>
                    )}
                  </div>

                  {/* Actions on hover */}
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => saveRename(conv.id, e)}
                          className="p-1 hover:text-emerald-400"
                          title="Save title"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelRename}
                          className="p-1 hover:text-zinc-400"
                          title="Cancel"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => startRename(conv, e)}
                          className="p-1 text-zinc-400 hover:text-white"
                          title="Rename trip"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Delete this conversation?")) {
                              onDeleteConversation(conv.id);
                            }
                          }}
                          className="p-1 text-zinc-400 hover:text-red-400"
                          title="Delete conversation"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Model Selector & Footer */}
        <div className="p-3 border-t border-zinc-800/80 space-y-2">
          {/* Model Selector Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 text-xs border border-zinc-800 transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <Cpu className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate font-medium">{currentModel.name}</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400">
                  Free
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${
                  showModelPicker ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Model Selector Popup */}
            {showModelPicker && (
              <div className="absolute bottom-full mb-2 left-0 right-0 p-2 rounded-xl bg-[#1c1c20] border border-zinc-700 shadow-2xl space-y-1 z-50">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  OpenRouter Free Models
                </div>
                {FREE_MODELS.map((model: OpenRouterModelOption) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      onSelectModel(model.id);
                      setShowModelPicker(false);
                    }}
                    className={`flex flex-col w-full text-left p-2 rounded-lg text-xs transition-colors ${
                      selectedModel === model.id
                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                        : "hover:bg-zinc-800/80 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{model.name}</span>
                      <span className="text-[10px] text-zinc-500">
                        {model.provider}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                      {model.description}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User and Theme Footer */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>SQLite Connected</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
}
