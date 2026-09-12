"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp, Mic, MicOff, Square } from "lucide-react";

// Add Web Speech API type declaration
declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: (message: string) => void;
  isStreaming: boolean;
  onStop: () => void;
  placeholder?: string;
}

export function ChatInput({
  input,
  setInput,
  onSend,
  isStreaming,
  onStop,
  placeholder = "Ask Joojoo to plan a trip, compare destinations, or pack smartly...",
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [input]);

  // Setup Web Speech API for voice dictation
  const toggleSpeechRecognition = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(input ? `${input} ${transcript}` : transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim()) {
        onSend(input);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStreaming) {
      onStop();
    } else if (input.trim()) {
      onSend(input);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <form
        onSubmit={handleFormSubmit}
        className="relative flex items-end gap-2 p-2 sm:p-2.5 rounded-3xl bg-white dark:bg-[#1a1a1e] border border-zinc-200 dark:border-zinc-800 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 focus-within:ring-2 focus-within:ring-blue-500/20 shadow-lg dark:shadow-2xl transition-all"
      >
        {/* Voice Dictation Button */}
        <button
          type="button"
          onClick={toggleSpeechRecognition}
          className={`p-2 rounded-full transition-colors shrink-0 ${
            isListening
              ? "bg-red-500/20 text-red-500 animate-pulse"
              : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
          title={isListening ? "Listening... Click to stop" : "Use microphone"}
          aria-label="Voice input"
        >
          {isListening ? (
            <MicOff className="w-5 h-5 text-red-500" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening... Speak now..." : placeholder}
          rows={1}
          className="flex-1 max-h-44 py-1.5 px-1 bg-transparent border-none outline-none resize-none text-sm sm:text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 leading-relaxed scrollbar-none"
        />

        {/* Submit or Stop Button */}
        <button
          type="submit"
          disabled={!isStreaming && !input.trim()}
          className={`p-2 rounded-full transition-all shrink-0 ${
            isStreaming
              ? "bg-red-500 hover:bg-red-600 text-white"
              : input.trim()
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30"
              : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
          }`}
          title={isStreaming ? "Stop generating" : "Send message"}
          aria-label={isStreaming ? "Stop generating" : "Send message"}
        >
          {isStreaming ? (
            <Square className="w-4 h-4 fill-current" />
          ) : (
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          )}
        </button>
      </form>
    </div>
  );
}
