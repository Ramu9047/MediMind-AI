'use client';

import React, { useState } from 'react';
import { fetchApi } from '@/lib/api';
import { Bot, Send, Sparkles, BookOpen, AlertTriangle, HelpCircle } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  "How do I manage high blood pressure naturally?",
  "What is the difference between a cold and the flu?",
  "What diet is best for managing Type 2 Diabetes?",
  "Why are routine diagnostic blood panels recommended?"
];

export default function FAQAssistantPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<any[]>([
    {
      sender: 'bot',
      answer: "Hello! I'm the MediMind AI FAQ Assistant. I can answer general, non-diagnostic health and wellness questions grounded in our verified medical knowledge base.",
      sources: [],
      disclaimer: "MediMind AI provides educational information only and is not a substitute for professional medical advice, diagnosis, or treatment."
    }
  ]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (textToAsk?: string) => {
    const q = textToAsk || query;
    if (!q.trim()) return;

    const userMsg = { sender: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToAsk) setQuery('');
    setLoading(true);

    try {
      const res = await fetchApi('/faq/ask', {
        method: 'POST',
        body: JSON.stringify({ query: q }),
      });

      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          answer: res.answer,
          sources: res.sources || [],
          disclaimer: res.disclaimer
        }
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          answer: "I experienced an error retrieving information from the medical knowledge base. Please try rephrasing your question.",
          sources: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4 animate-card-rise">
      
      {/* Header */}
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-tealPrimary dark:text-teal-400 text-xs font-mono font-semibold uppercase tracking-wider">
          <Bot className="w-3.5 h-3.5" />
          <span>Grounded Medical RAG Search</span>
        </div>
        <h1 className="text-3xl font-heading font-extrabold text-ink dark:text-white">AI Medical FAQ Assistant</h1>
        <p className="text-sm text-inkMuted">
          Ask general health questions and receive evidence-grounded answers accompanied by verified clinical source snippets.
        </p>
      </div>

      {/* Quick Prompt Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {SUGGESTED_QUESTIONS.map((sq, idx) => (
          <button
            key={idx}
            onClick={() => handleAsk(sq)}
            className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-inkMuted hover:text-tealPrimary transition-colors flex items-center gap-1 shadow-xs"
          >
            <HelpCircle className="w-3 h-3 text-tealPrimary" />
            <span>{sq}</span>
          </button>
        ))}
      </div>

      {/* Chat Conversation Box */}
      <div className="clinical-card p-6 min-h-[420px] flex flex-col justify-between">
        
        {/* Messages Feed */}
        <div className="space-y-6 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              {msg.sender === 'user' ? (
                <div className="max-w-md p-4 rounded-2xl bg-tealPrimary text-white text-xs font-medium shadow-sm">
                  {msg.text}
                </div>
              ) : (
                <div className="max-w-2xl space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-ink dark:text-slate-200">
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <Bot className="w-4 h-4 text-tealPrimary" />
                    <span className="font-heading font-bold text-ink dark:text-white">MediMind Knowledge Base Response</span>
                  </div>

                  <p className="whitespace-pre-line leading-relaxed">{msg.answer}</p>

                  {/* Grounded Source Snippets */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="text-[11px] font-mono font-bold text-tealPrimary uppercase tracking-wider flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" /> Citation Sources & Snippets
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.sources.map((src: any, sIdx: number) => (
                          <div key={sIdx} className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                            <span className="font-semibold text-ink dark:text-white block">{src.title}</span>
                            <span className="text-[10px] text-tealPrimary font-mono block">{src.source} (Relevance: {src.relevance_score})</span>
                            <p className="text-inkMuted italic text-[10px] line-clamp-2">{src.snippet}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg.disclaimer && (
                    <div className="pt-1 text-[10px] text-amberWarn font-medium italic flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>{msg.disclaimer}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-tealPrimary p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl w-max border border-slate-200 dark:border-slate-800">
              <Sparkles className="w-4 h-4 animate-spin text-tealPrimary" />
              <span>Querying verified medical knowledge base...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="relative pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a non-diagnostic health question (e.g. GERD diet guidelines, flu vs cold)..."
            className="w-full pl-4 pr-12 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-ink dark:text-white focus:outline-none focus:border-tealPrimary"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 p-2 rounded-lg bg-tealPrimary text-white disabled:opacity-50 hover:bg-tealDeep transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
