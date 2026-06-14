"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';

const COACH_STORAGE_KEY = "cyclogenai_selected_coach";
const TRAINING_START_KEY = "cyclogenai_training_start";

function loadCoach() {
  try {
    const raw = localStorage.getItem("cyclogenai_user");
    if (raw) {
      const u = JSON.parse(raw);
      if (u.selectedCoach) return u.selectedCoach;
    }
    return JSON.parse(localStorage.getItem(COACH_STORAGE_KEY));
  } catch { return null; }
}

function getTrainingWeek() {
  try {
    const raw = localStorage.getItem("cyclogenai_user");
    let start = null;
    if (raw) {
      const u = JSON.parse(raw);
      if (u.trainingStart) start = u.trainingStart;
    }
    if (!start) start = localStorage.getItem(TRAINING_START_KEY);
    if (!start) {
      start = new Date().toISOString();
      localStorage.setItem(TRAINING_START_KEY, start);
      return 1;
    }
    const startDate = new Date(start);
    const now = new Date();
    const diffMs = now.getTime() - startDate.getTime();
    const diffWeeks = Math.floor(diffMs / (7 * 86400000));
    return Math.max(1, diffWeeks + 1);
  } catch { return 1; }
}

const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000;
const LAST_CLOSE_KEY = "cyclogenai_chat_last_close";
const SAVED_SESSION_KEY = "cyclogenai_chat_saved_session";

function generateSessionId() {
  return `web_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function saveSession(messages, sessionId) {
  try {
    localStorage.setItem(SAVED_SESSION_KEY, JSON.stringify({ messages, sessionId, savedAt: Date.now() }));
  } catch {}
}

function loadSavedSession() {
  try {
    const raw = localStorage.getItem(SAVED_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearSavedSession() {
  localStorage.removeItem(SAVED_SESSION_KEY);
}

const PaceBotChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [coach, setCoach] = useState(null);
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [showingContinuePrompt, setShowingContinuePrompt] = useState(false);
  const messagesEndRef = useRef(null);
  const pendingCommandRef = useRef(null);
  const sessionIdRef = useRef(null);
  const savedSessionRef = useRef(null);

  const loadFromStorage = useCallback(() => {
    setCoach(loadCoach());
    try {
      const u = JSON.parse(localStorage.getItem("cyclogenai_user") || "{}");
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

  // Session management: check timeout on open
  useEffect(() => {
    if (!isOpen) return;
    const lastClose = parseInt(localStorage.getItem(LAST_CLOSE_KEY) || '0', 10);
    const expired = Date.now() - lastClose > SESSION_TIMEOUT_MS;

    if (sessionIdRef.current && !expired) {
      // Session still valid — do nothing
      return;
    }

    if (expired) {
      // Save old session before clearing
      if (messages.length > 0 && sessionIdRef.current) {
        saveSession(messages, sessionIdRef.current);
      }
      savedSessionRef.current = loadSavedSession();
      const newId = generateSessionId();
      sessionIdRef.current = newId;
      setMessages([]);

      if (savedSessionRef.current) {
        setShowingContinuePrompt(true);
        setTimeout(() => {
          setMessages([{
            id: Date.now(),
            sender: 'bot',
            text: `Your session has expired. Send /continue to pick up where you left off, or type a new message to start a fresh conversation.`,
          }]);
        }, 300);
        return;
      }
    }

    if (!sessionIdRef.current) {
      sessionIdRef.current = generateSessionId();
    }
  }, [isOpen]);

  // Track close time & save session
  const handleClose = useCallback(() => {
    if (messages.length > 0 && sessionIdRef.current) {
      saveSession(messages, sessionIdRef.current);
    }
    localStorage.setItem(LAST_CLOSE_KEY, String(Date.now()));
    setShowingContinuePrompt(false);
    setIsOpen(false);
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0 && !showingContinuePrompt && !pendingCommandRef.current) {
      setTimeout(() => {
        setMessages([{
          id: Date.now(),
          sender: 'bot',
          text: `Hey there, rider! I'm ${coach?.name || "PaceBot"}, your AI cycling coach. How can I help you today?`,
        }]);
      }, 500);
    }
  }, [isOpen, messages.length, showingContinuePrompt, coach]);

  useEffect(() => {
    if (isOpen && pendingCommandRef.current) {
      const cmd = pendingCommandRef.current;
      pendingCommandRef.current = null;
      sendToAgent(cmd);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const COMMANDS = {
    '/help': 'Show all available commands',
    '/new': 'Start a fresh conversation',
    '/clear': 'Clear the current chat',
    '/continue': 'Resume your previous expired session',
    '/analyse': 'Analyze your most recent activity and compare with the planned workout',
    '/plan': 'View or generate your weekly training plan',
    '/review': 'Get an AI review of your last ride',
    '/sync': 'Trigger a Strava sync',
    '/zones': 'Show your current power zones',
    '/week': 'Open the weekly training view',
    '/month': 'Analyse your month week-by-week with performance breakdown',
  };

  const COMMAND_LIST = Object.entries(COMMANDS)
    .map(([cmd, desc]) => `${cmd} — ${desc}`)
    .join('\n');

  const addBotMessage = useCallback((text) => {
    setMessages((prev) => [...prev, { id: Date.now(), sender: 'bot', text }]);
  }, []);

  const sendToAgent = async (msg) => {
    const trimmed = msg.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, { id: Date.now(), sender: 'user', text: trimmed }]);
    setLoading(true);

    try {
      const res = await api.post('/agent/chat', { message: trimmed, chatId: sessionIdRef.current });
      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'bot', text: res?.text || 'No response.' }]);
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

    if (showingContinuePrompt) {
      if (msg.toLowerCase() === '/continue') {
        setShowingContinuePrompt(false);
        const saved = savedSessionRef.current;
        if (saved) {
          sessionIdRef.current = saved.sessionId;
          setMessages(saved.messages || []);
        }
        return;
      }
      setShowingContinuePrompt(false);
      clearSavedSession();
      savedSessionRef.current = null;
    }

    // Handle local commands
    const lower = msg.toLowerCase();
    if (lower === '/help') {
      addBotMessage(`Available commands:\n${COMMAND_LIST}\n\nOr just ask me anything in natural language!`);
      return;
    }

    if (lower === '/clear') {
      setMessages([]);
      return;
    }

    if (lower === '/new') {
      clearSavedSession();
      savedSessionRef.current = null;
      sessionIdRef.current = generateSessionId();
      setMessages([]);
      return;
    }

    sendToAgent(msg);
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
            className={`fixed bottom-28 right-8 z-50 bg-black rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
              isFullscreen ? 'w-[90vw] h-[85vh]' : 'w-[420px] h-[560px]'
            }`}
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
              <div className="flex items-center gap-2">
                <button onClick={() => setIsFullscreen(!isFullscreen)} className="text-white/40 hover:text-white transition-colors">
                  {isFullscreen ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" /></svg>
                  )}
                </button>
                <button onClick={handleClose} className="text-white/40 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
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
