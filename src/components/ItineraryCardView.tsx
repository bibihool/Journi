"use client";

import { useMemo } from "react";
import { Sun, Sunset, Sunrise, MapPin, Calendar, Sparkles } from "lucide-react";

interface ItineraryCardViewProps {
  content: string;
  onClose: () => void;
}

interface DayPlan {
  dayNumber: string;
  title: string;
  morning?: string[];
  afternoon?: string[];
  evening?: string[];
  generalNotes?: string[];
}

export function ItineraryCardView({ content, onClose }: ItineraryCardViewProps) {
  const dayPlans = useMemo(() => {
    const days: DayPlan[] = [];
    const lines = content.split("\n");

    let currentDay: DayPlan | null = null;
    let currentSection: "morning" | "afternoon" | "evening" | "general" = "general";

    for (const line of lines) {
      const trimmed = line.trim();

      // Check for Day headers (e.g., "### Day 1: Arrival & Exploring Shinjuku" or "**Day 2: ...**")
      const dayMatch = trimmed.match(
        /^(?:#{1,4}\s*)?(?:\*\*)?Day\s*(\d+)[:\s–—-]+([^*\n#]+)(?:\*\*)?/i
      );

      if (dayMatch) {
        if (currentDay) {
          days.push(currentDay);
        }
        currentDay = {
          dayNumber: `Day ${dayMatch[1]}`,
          title: dayMatch[2].trim(),
          morning: [],
          afternoon: [],
          evening: [],
          generalNotes: [],
        };
        currentSection = "general";
        continue;
      }

      if (!currentDay) continue;

      // Check for sub-periods (Morning, Afternoon, Evening)
      if (/(?:morning|breakfast)/i.test(trimmed) && trimmed.length < 30) {
        currentSection = "morning";
        continue;
      } else if (
        /(?:afternoon|lunch)/i.test(trimmed) &&
        trimmed.length < 30
      ) {
        currentSection = "afternoon";
        continue;
      } else if (
        /(?:evening|night|dinner)/i.test(trimmed) &&
        trimmed.length < 30
      ) {
        currentSection = "evening";
        continue;
      }

      // Check bullet items or clean text
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || /^\d+\.\s/.test(trimmed)) {
        const cleanBullet = trimmed.replace(/^[-*]\s+|\d+\.\s+/, "").trim();
        if (!cleanBullet) continue;

        if (currentSection === "morning") {
          currentDay.morning?.push(cleanBullet);
        } else if (currentSection === "afternoon") {
          currentDay.afternoon?.push(cleanBullet);
        } else if (currentSection === "evening") {
          currentDay.evening?.push(cleanBullet);
        } else {
          currentDay.generalNotes?.push(cleanBullet);
        }
      } else if (trimmed && !trimmed.startsWith("#")) {
        if (currentSection === "general") {
          currentDay.generalNotes?.push(trimmed);
        }
      }
    }

    if (currentDay) {
      days.push(currentDay);
    }

    return days;
  }, [content]);

  if (dayPlans.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center my-4">
        <Sparkles className="w-8 h-8 text-blue-400 mx-auto mb-2 opacity-70" />
        <p className="text-sm font-medium text-zinc-300">
          No day-by-day structured itinerary detected in this message.
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          Ask Joojoo to create a multi-day itinerary (e.g. &ldquo;Plan a 5-day trip to Tokyo&rdquo;) to view cards.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 px-3 py-1.5 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
        >
          Return to standard view
        </button>
      </div>
    );
  }

  return (
    <div className="w-full my-4 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Day-by-Day Itinerary View ({dayPlans.length} Days)
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
        >
          Switch to Markdown
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dayPlans.map((day, idx) => (
          <div
            key={idx}
            className="flex flex-col rounded-2xl p-4 bg-white dark:bg-[#1f1f24] border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-blue-500/40 transition-colors"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                {day.dayNumber}
              </span>
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Stop {idx + 1}
              </span>
            </div>

            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 line-clamp-2">
              {day.title}
            </h4>

            {/* Timeline Activities */}
            <div className="space-y-3 text-xs flex-1">
              {day.morning && day.morning.length > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-500/5 dark:bg-amber-400/5 border border-amber-500/15">
                  <div className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400 mb-1.5">
                    <Sunrise className="w-3.5 h-3.5" />
                    <span>Morning</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-zinc-700 dark:text-zinc-300">
                    {day.morning.map((m, i) => (
                      <li key={i} className="leading-relaxed">
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {day.afternoon && day.afternoon.length > 0 && (
                <div className="p-2.5 rounded-xl bg-blue-500/5 dark:bg-blue-400/5 border border-blue-500/15">
                  <div className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400 mb-1.5">
                    <Sun className="w-3.5 h-3.5" />
                    <span>Afternoon</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-zinc-700 dark:text-zinc-300">
                    {day.afternoon.map((a, i) => (
                      <li key={i} className="leading-relaxed">
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {day.evening && day.evening.length > 0 && (
                <div className="p-2.5 rounded-xl bg-purple-500/5 dark:bg-purple-400/5 border border-purple-500/15">
                  <div className="flex items-center gap-1.5 font-medium text-purple-600 dark:text-purple-400 mb-1.5">
                    <Sunset className="w-3.5 h-3.5" />
                    <span>Evening</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-zinc-700 dark:text-zinc-300">
                    {day.evening.map((e, i) => (
                      <li key={i} className="leading-relaxed">
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {day.generalNotes && day.generalNotes.length > 0 && (
                <div className="pt-1">
                  <ul className="list-disc list-inside space-y-1 text-zinc-600 dark:text-zinc-400">
                    {day.generalNotes.map((note, i) => (
                      <li key={i} className="leading-relaxed">
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
