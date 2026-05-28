"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';

const COACH_STORAGE_KEY = "cycloai_selected_coach";
const TRAINING_START_KEY = "cycloai_training_start";

function loadCoach() {
  try {
    return JSON.parse(localStorage.getItem(COACH_STORAGE_KEY));
  } catch { return null; }
}

function getTrainingWeek() {
  try {
    const start = localStorage.getItem(TRAINING_START_KEY);
    if (!start) {
      const now = new Date().toISOString();
      localStorage.setItem(TRAINING_START_KEY, now);
      return 1;
    }
    const startDate = new Date(start);
    const now = new Date();
    const diffMs = now.getTime() - startDate.getTime();
    const diffWeeks = Math.floor(diffMs / (7 * 86400000));
    return Math.max(1, diffWeeks + 1);
  } catch { return 1; }
}

const PaceBotChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [coach, setCoach] = useState(null);
  const [userProfileImage, setUserProfileImage] = useState(null);
  const messagesEndRef = useRef(null);
  const pendingCommandRef = useRef(null);

  const loadFromStorage = useCallback(() => {
    setCoach(loadCoach());
    try {
      const u = JSON.parse(localStorage.getItem("cycloai_user") || "{}");
      setUserProfileImage(u.profileImage || null);
    } catch {}
  }, []);

  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  useEffect(() => {
    const handler = () => loadFromStorage();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [loadFromStorage]);

  useEffect(() => {
    const handler = (e) => {
      pendingCommandRef.current = e.detail?.command || null;
      setIsOpen(true);
    };
    window.addEventListener("openai-chat", handler);
    return () => window.removeEventListener("openai-chat", handler);
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0 && !pendingCommandRef.current) {
      setTimeout(() => {
        setMessages([{
          id: 1,
          sender: 'bot',
          text: `Hey there, rider! I'm ${coach?.name || "PaceBot"}, your AI cycling coach. How can I help you today?`,
        }]);
      }, 500);
    }
  }, [isOpen, messages.length, coach]);

  useEffect(() => {
    if (isOpen && pendingCommandRef.current) {
      const cmd = pendingCommandRef.current;
      pendingCommandRef.current = null;
      sendAnalysis(cmd);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendAnalysis = async (cmd) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, { id: Date.now(), sender: 'user', text: trimmed }]);
    setLoading(true);

    const activityType = trimmed.startsWith('/month') ? 'monthly'
      : trimmed.startsWith('/week') ? 'weekly'
      : trimmed.startsWith('/day') ? 'daily'
      : 'chat';

    try {
      let activities = [];
      try {
        const data = await api.get('/activities');
        activities = (data || []).slice(0, 50);
      } catch {}

      const res = await api.post('/analysis', {
        type: activityType,
        activities,
        message: trimmed,
      });
      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'bot', text: res?.analysis || 'No response.' }]);
    } catch {
      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'bot', text: 'Sorry, I encountered an error processing your request.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || loading) return;
    const msg = inputMessage.trim();
    setInputMessage('');
    sendAnalysis(msg);
  };

  return (
    <>
      <motion.button
        className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full bg-[#FF5500] shadow-lg flex items-center justify-center cursor-pointer"
        whileHover={{ scale: 1.1, boxShadow: '0 0 15px rgba(255, 85, 0, 0.7)' }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {coach ? (
          <img src={coach.image} alt={coach.name} className="w-full h-full rounded-full object-cover border-2 border-white/20" />
        ) : (
          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 0 0-8 4v8c0 2.21 1.79 4 4 4h8a4 4 0 0 0 4-4V6a10 10 0 0 0-8-4z" />
            <path d="M12 18h.01" />
          </svg>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 300 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 300 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="fixed bottom-28 right-8 z-50 w-[420px] h-[560px] bg-black rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                {coach && (
                  <img src={coach.image} alt={coach.name} className="w-9 h-9 rounded-full border border-white/10 object-cover" />
                )}
                <div>
                  <h3 className="font-dmSans text-sm font-semibold text-white">{coach?.name || "PaceBot"}</h3>
                  <p className="font-dmSans text-xs text-white/40">AI Coach</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'bot' && coach && (
                    <img src={coach.image} alt={coach.name} className="w-8 h-8 rounded-full mr-3 mt-0.5 border border-white/10 object-cover flex-shrink-0" />
                  )}
                  {msg.sender === 'user' && userProfileImage && (
                    <img src={userProfileImage} alt="" className="w-8 h-8 rounded-full ml-3 mt-0.5 border border-white/10 object-cover flex-shrink-0 order-last" />
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.sender === 'user'
                      ? 'bg-[#FF5500] text-white rounded-br-md'
                      : 'bg-[#1a1a1a] text-[#a0a0a0] rounded-bl-md'
                  }`}>
                    <p className="font-dmSans text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
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

            <div className="border-t border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Ask your coach..."
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-dmSans text-sm text-white outline-none transition focus:border-[#FF5500]/40 placeholder:text-white/30"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !inputMessage.trim()}
                  className="rounded-xl bg-[#FF5500] px-5 py-3 font-dmSans text-sm font-semibold text-white transition hover:bg-[#ff6a1a] disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export { getTrainingWeek };
export default PaceBotChat;
