"use client";

import React, { useState } from "react";
import { FileText, Clock, Mic, AlignLeft } from "lucide-react";

export function WordCounter() {
  const [text, setText] = useState<string>(
    "Daily Discovery is a modern editorial platform delivering verified news, scientific discoveries, interactive quizzes, and practical online tools."
  );

  const stats = React.useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const charsWithSpaces = text.length;
    const charsWithoutSpaces = text.replace(/\s+/g, "").length;
    const sentences = trimmed ? (trimmed.match(/[.!?]+(?=\s|$)/g) || []).length || 1 : 0;
    const paragraphs = trimmed ? trimmed.split(/\n+/).filter((p) => p.trim().length > 0).length : 0;

    // Reading time (200 words per min)
    const readingTimeMins = Math.ceil(words / 200);
    // Speaking time (130 words per min)
    const speakingTimeMins = Math.ceil(words / 130);

    return {
      words,
      charsWithSpaces,
      charsWithoutSpaces,
      sentences,
      paragraphs,
      readingTimeMins,
      speakingTimeMins,
    };
  }, [text]);

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-center">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
            Words
          </span>
          <span className="text-3xl font-black text-emerald-900 dark:text-emerald-100 mt-1 block">
            {stats.words}
          </span>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
          <span className="text-xs font-semibold text-slate-500 block">Characters</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 block">
            {stats.charsWithSpaces}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">({stats.charsWithoutSpaces} no spaces)</span>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center">
          <span className="text-xs font-semibold text-slate-500 block">Sentences</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 block">
            {stats.sentences}
          </span>
        </div>

        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-center">
          <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 block">Reading Time</span>
          <span className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mt-1 block">
            ~{stats.readingTimeMins} min
          </span>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-xl text-center">
          <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 block">Speaking Time</span>
          <span className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1 block">
            ~{stats.speakingTimeMins} min
          </span>
        </div>
      </div>

      {/* Editor textarea */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Input Text
          </label>
          <button
            onClick={() => setText("")}
            className="text-xs font-semibold text-rose-600 hover:underline"
          >
            Clear Text
          </button>
        </div>
        <textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type your text here to analyze..."
          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-900 dark:text-slate-100 font-normal focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-y"
        />
      </div>
    </div>
  );
}
