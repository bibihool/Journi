"use client";

import { X, ExternalLink, MapPin } from "lucide-react";

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
}

export function MapModal({ isOpen, onClose, destination }: MapModalProps) {
  if (!isOpen) return null;

  const encodedDest = encodeURIComponent(destination || "World");
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?query=${encodedDest}&layer=mapnik`;
  const fullMapUrl = `https://www.openstreetmap.org/search?query=${encodedDest}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white dark:bg-[#1c1c21] border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Destination Preview
              </h3>
              <p className="text-xs text-zinc-500">{destination || "Interactive Map"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={fullMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Open full map in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Map iframe */}
        <div className="relative w-full h-[380px] bg-zinc-100 dark:bg-zinc-900">
          <iframe
            title={`Map of ${destination}`}
            src={embedUrl}
            className="w-full h-full border-0"
            loading="lazy"
          />
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 bg-zinc-50 dark:bg-[#161619] border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
          <span>Map data © OpenStreetMap contributors</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
