"use client";

import { useState } from "react";
import {
  Compass,
  Calendar,
  Wallet,
  Sparkles,
  Luggage,
  Heart,
  FileCheck,
  Scale,
} from "lucide-react";
import { SuggestedPromptItem } from "@/types/chat";

interface SuggestedPromptsProps {
  onSelectPrompt: (promptText: string, autoSend?: boolean) => void;
}

const ALL_PROMPTS: (SuggestedPromptItem & { icon: React.ElementType })[] = [
  {
    id: "5-day-tokyo",
    title: "5-Day Tokyo Adventure",
    prompt: "Plan a detailed 5-day trip to Tokyo with cultural sights, food spots, and neighborhood exploration.",
    category: "itinerary",
    icon: Calendar,
    previewTag: "Itinerary",
  },
  {
    id: "budget-autumn",
    title: "Budget Fall Escapes",
    prompt: "Find budget-friendly travel destinations in Europe and Asia for autumn with cheap flights and great weather.",
    category: "budget",
    icon: Wallet,
    previewTag: "Budget",
  },
  {
    id: "family-rome",
    title: "Family Trip to Rome",
    prompt: "Build a relaxed day-by-day itinerary for a family trip to Rome with kid-friendly activities, gelato spots, and easy transit.",
    category: "itinerary",
    icon: Compass,
    previewTag: "Family",
  },
  {
    id: "pack-iceland",
    title: "Packing for Iceland",
    prompt: "What should I pack for a 7-day road trip to Iceland in October? Include layered clothing and photography gear.",
    category: "packing",
    icon: Luggage,
    previewTag: "Packing",
  },
  {
    id: "hidden-gems-barcelona",
    title: "Hidden Gems in Barcelona",
    prompt: "Recommend hidden-gem spots, quiet tapas bars, and lesser-known architectural treasures in Barcelona away from tourist crowds.",
    category: "hidden-gems",
    icon: Sparkles,
    previewTag: "Hidden Gems",
  },
  {
    id: "visas-japan",
    title: "Japan Travel & Visas",
    prompt: "What documents, transit passes, and visa requirements do I need to prepare before traveling to Japan as a tourist?",
    category: "logistics",
    icon: FileCheck,
    previewTag: "Logistics",
  },
  {
    id: "romantic-zurich",
    title: "Romantic Getaway near Zurich",
    prompt: "Suggest a romantic weekend getaway within 2 hours of Zurich with scenic alpine views, cozy chalets, and fondue spots.",
    category: "couples",
    icon: Heart,
    previewTag: "Romance",
  },
  {
    id: "compare-honeymoon",
    title: "Bali vs Thailand Honeymoon",
    prompt: "Compare Bali vs Thailand for a 2-week honeymoon in terms of luxury resorts, budget, beaches, nightlife, and romance.",
    category: "couples",
    icon: Scale,
    previewTag: "Comparison",
  },
];

export function SuggestedPrompts({ onSelectPrompt }: SuggestedPromptsProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "All Ideas" },
    { id: "itinerary", label: "Itineraries" },
    { id: "budget", label: "Budget & Deals" },
    { id: "hidden-gems", label: "Hidden Gems" },
    { id: "packing", label: "Packing & Prep" },
    { id: "couples", label: "Getaways & Honeymoons" },
  ];

  const filteredPrompts =
    activeCategory === "all"
      ? ALL_PROMPTS
      : ALL_PROMPTS.filter((p) => p.category === activeCategory);

  return (
    <div className="w-full max-w-3xl mx-auto mt-6 px-4">
      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center mb-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
              activeCategory === cat.id
                ? "bg-zinc-800 text-zinc-100 border border-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:border-zinc-300"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:bg-zinc-800/80 border border-transparent"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Suggested Prompt Chips Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {filteredPrompts.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectPrompt(item.prompt, true)}
              className="group flex items-start gap-3 p-3 rounded-xl text-left bg-white/70 dark:bg-[#1b1b1f] hover:bg-zinc-50 dark:hover:bg-[#232328] border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-150 shadow-sm"
            >
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {item.title}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shrink-0">
                    {item.previewTag}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
                  {item.prompt}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
