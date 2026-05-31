"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';

const typeLabels = {
  daily: 'Daily Review',
  weekly: 'Weekly Review',
  monthly: 'Monthly Review',
  activity: 'Activity Review',
  chat: 'AI Coach',
};

export default function AnalysisModal({ isOpen, onClose, type, activities, previousActivities, activityName }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatMode, setChatMode] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && activities?.length > 0 && !chatMode) {
      setLoading(true);
      setAnalysis(null);
      api.post('/analysis', {
        type: type || 'chat',
        activities,
        previousActivities: previousActivities || [],
        message: activityName ? `Review this activity: ${activityName}` : undefined,
      })
        .then((res) => {
          setAnalysis(res?.analysis || 'No analysis generated.');
          setMessages([{ sender: 'bot', text: res?.analysis || 'No analysis generated.' }]);
        })
        .catch(() => {
          const fallback = 'Analysis service is currently unavailable. Please try again later.';
          setAnalysis(fallback);
          setMessages([{ sender: 'bot', text: fallback }]);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, type, activities]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    const userMsg = message.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setMessage('');

    setLoading(true);
    api.post('/analysis', {
      type: 'chat',
      activities,
      previousActivities: previousActivities || [],
      message: userMsg,
    })
      .then((res) => {
        setMessages((prev) => [...prev, { sender: 'bot', text: res?.analysis || 'No response.' }]);
      })
      .catch(() => {
        setMessages((prev) => [...prev, { sender: 'bot', text: 'Sorry, I encountered an error.' }]);
      })
      .finally(() => setLoading(false));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl border border-white/[0.08] bg-surface-cards shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
              <div>
                <h2 className="font-barlowCondensed text-xl uppercase tracking-wide text-white">
                  {typeLabels[type] || 'AI Analysis'}
                </h2>
                {activityName && (
                  <p className="font-dmSans text-xs text-white/30 mt-0.5">{activityName}</p>
                )}
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
              {loading && !analysis ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#FF5500] border-t-transparent" />
                  <p className="font-dmSans text-sm text-white/30">Analyzing your training...</p>
                  <p className="font-dmSans text-xs text-white/20">Reviewing {activities?.length || 0} activities</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 ${
                        msg.sender === 'user'
                          ? 'bg-[#FF5500] text-white rounded-br-md'
                          : 'bg-[#1a1a1a] text-[#d0d0d0] rounded-bl-md'
                      }`}>
                        <p className="font-dmSans text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl bg-[#1a1a1a] px-5 py-3.5 rounded-bl-md">
                        <div className="flex gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="h-2 w-2 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="h-2 w-2 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-white/[0.06] px-6 py-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Ask a follow-up question..."
                  className="flex-1 rounded-xl border border-white/[0.08] bg-white/5 px-4 py-2.5 font-dmSans text-sm text-white outline-none transition focus:border-[#FF5500]/40 placeholder:text-white/25"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !message.trim()}
                  className="rounded-xl bg-[#FF5500] px-5 py-2.5 font-dmSans text-sm font-semibold text-white transition hover:bg-[#FF5500]/90 disabled:opacity-40"
                >
                  Ask
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
