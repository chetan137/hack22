import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { apiClient } from '../../api/client';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface Suggestion {
  label: string;
  message: string;
}

export default function GreenCoach() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHistory();
    fetchSuggestions();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await apiClient.get<ChatMessage[]>('/coach/history');
      if (res.data.length > 0) {
        setMessages(res.data);
      } else {
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content:
              "👋 Hi! I'm **EcoCoach**, your AI sustainability advisor.\n\nI can help you:\n- 🌱 Set **weekly eco challenges**\n- 📊 Review your **carbon footprint progress**\n- 💡 Get personalized **sustainability tips**\n\nWhat would you like to explore?",
          },
        ]);
      }
    } catch (e) {
      console.error('Failed to fetch history', e);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await apiClient.get<Suggestion[]>('/coach/suggestions');
      setSuggestions(res.data);
    } catch (e) {
      console.error('Failed to fetch suggestions', e);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await apiClient.post('/coach/chat', { message: text });
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.response,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col">
      {/* Chat header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm shrink-0">
        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-brand-500 to-emerald-400 flex items-center justify-center shadow-lg">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-white">EcoCoach</h2>
          <p className="text-xs text-slate-400">Powered by Gemini AI · Always learning from your habits</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          <span className="text-xs text-slate-400">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${
                  msg.role === 'user'
                    ? 'bg-brand-500/20'
                    : 'bg-gradient-to-tr from-brand-500 to-emerald-400'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="h-4 w-4 text-brand-400" />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-500 text-white rounded-tr-none'
                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                }`}
              >
                {msg.role === 'user' ? (
                  <p>{msg.content}</p>
                ) : (
                  <div className="prose prose-sm prose-invert prose-p:my-1 prose-li:my-0.5 max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <motion.div
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-tr from-brand-500 to-emerald-400 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="shrink-0 border-t border-slate-800 bg-slate-900/80 backdrop-blur-sm px-4 sm:px-8 pb-6 pt-4">
        {/* Quick suggestions (show when few messages) */}
        {suggestions.length > 0 && messages.length <= 2 && (
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s.message)}
                disabled={isLoading}
                className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 hover:border-brand-500/60 hover:text-brand-400 rounded-full transition-colors"
              >
                {s.label}
                <ArrowRight className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for eco-tips, weekly challenges, or progress review…"
            disabled={isLoading}
            className="flex-1 bg-slate-800 border border-slate-700 focus:border-brand-500 text-white placeholder-slate-500 rounded-full px-5 py-3.5 pr-14 text-sm focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 w-10 h-10 flex items-center justify-center bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:hover:bg-brand-500 text-white rounded-full transition-colors"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
          </button>
        </form>
        <p className="text-center text-xs text-slate-600 mt-3">
          EcoCoach may occasionally make mistakes. Verify important information independently.
        </p>
      </div>
    </div>
  );
}
