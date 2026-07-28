"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { useDeviceType } from '../../hooks/useDeviceType';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

function getMonday(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date;
}

function getCurrentRelativeWeek() {
  try {
    const stored = localStorage.getItem("cyclogenai_user");
    if (stored) {
      const u = JSON.parse(stored);
      if (u.trainingStart) {
        const startMonday = getMonday(new Date(u.trainingStart));
        const todayMonday = getMonday(new Date());
        const diffMs = todayMonday.getTime() - startMonday.getTime();
        return Math.round(diffMs / (7 * 86400000));
      }
    }
  } catch {}
  return 0;
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

const FLOW = { IDLE: 0, OPT_WEEK: 1, OPT_CHANGES: 2, OPT_CONFIRM: 3 };

const RIGIDITY_RULES = [
  { keyword: 'injury', note: 'Taking rest or reducing intensity due to injury is the right call — recovery comes first.' },
  { keyword: 'sick', note: 'Rest is essential when you\'re under the weather. Pushing through will only set you back.' },
  { keyword: 'race', note: 'Adjusting around a race makes sense — we should keep you fresh for race day.' },
  { keyword: 'event', note: 'Life events take priority. We\'ll adjust the plan to fit your schedule.' },
  { keyword: 'work', note: 'Work schedule changes are a valid reason to shift workouts around.' },
  { keyword: 'weather', note: 'Weather can make training unsafe or impractical. Smart to adjust.' },
  { keyword: 'time', note: 'If you\'re short on time, we can swap or shorten sessions.' },
  { keyword: 'tired', note: 'Fatigue is a signal, not a weakness. Recovery is training too.' },
  { keyword: 'fatigue', note: 'Accumulated fatigue deserves respect. Let\'s adjust the load.' },
  { keyword: 'pain', note: 'Pain is a warning sign. Reducing intensity or taking rest is wise.' },
  { keyword: 'bike', note: 'Bike issues or maintenance are a valid reason to adjust.' },
  { keyword: 'travel', note: 'Travel plans can interrupt training. We can reschedule around it.' },
];

function fmtDist(km) {
  if (km == null || isNaN(km)) return '';
  return ` ${Number(km).toFixed(2)}km`;
}

function formatPlanForChat(plan, weekLabel) {
  if (!plan || !plan.workouts) return `No plan found for ${weekLabel}.`;
  const days = plan.workouts
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map((w) => {
      const dist = fmtDist(w.distance);
      const zone = w.zoneBreakdown ? ` (${w.zoneBreakdown})` : '';
      const terrain = w.terrain ? ` · ${w.terrain}` : '';
      const importance = w.importance === 'high' ? ' 🔴' : w.importance === 'low' ? ' 🟢' : ' 🟡';
      return `${DAY_NAMES_FULL[w.dayOfWeek]}: ${w.type}${dist}${zone}${terrain}${importance}`;
    }).join('\n');
  const notes = plan.coachNotes ? `\n\nCoach Notes: ${plan.coachNotes}` : '';
  const aim = plan.skeleton?.aim ? `\n\n🎯 Weekly Focus: ${plan.skeleton.aim}` : '';
  return `${weekLabel}:\n${days}${aim}${notes}`;
}

function validateOptimizeReason(reason) {
  const lower = reason.toLowerCase();
  for (const rule of RIGIDITY_RULES) {
    if (lower.includes(rule.keyword)) {
      return { valid: true, note: rule.note };
    }
  }
  return { valid: false, note: '' };
}

const PaceBotChat = () => {
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [coach, setCoach] = useState(null);
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [showingContinuePrompt, setShowingContinuePrompt] = useState(false);
  const [flowState, setFlowState] = useState(FLOW.IDLE);
  const [flowData, setFlowData] = useState({});
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
    if (isOpen && isMobile) {
      setIsFullscreen(true);
    }
  }, [isOpen, isMobile]);

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
      if (cmd.toLowerCase().startsWith('/optimize')) {
        processMessage(cmd);
      } else {
        sendToAgent(cmd);
      }
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
    '/optimize': 'Optimize your weekly training plan',
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

  const fetchPlan = async (relativeWeek) => {
    try {
      const res = await api.get(`/training-context/weekly-plan?relativeWeek=${relativeWeek}`);
      return res;
    } catch { return null; }
  };

  const savePlan = async (relativeWeek, plan) => {
    try {
      await api.post('/training-context/weekly-plan', { relativeWeek, ...plan });
      return true;
    } catch { return false; }
  };

  const handleOptimizeMessage = (msg) => {
    const lower = msg.toLowerCase().trim();
    const userMsg = { id: Date.now(), sender: 'user', text: msg };
    setMessages((prev) => [...prev, userMsg]);

    if (flowState === FLOW.OPT_WEEK) {
      const baseRw = getCurrentRelativeWeek();
      let rw;
      if (lower.includes('this') || lower.includes('current')) {
        rw = baseRw;
      } else if (lower.includes('next')) {
        rw = baseRw + 1;
      } else {
        addBotMessage('Please reply with "this week" or "next week".');
        return;
      }

      setFlowData((prev) => ({ ...prev, selectedWeek: rw }));
      setFlowState(FLOW.OPT_CHANGES);

      fetchPlan(rw).then((plan) => {
        const weekLabel = rw === baseRw ? 'This Week (Current)' : 'Next Week';
        const formatted = formatPlanForChat(plan, weekLabel);
        addBotMessage(`Great choice! Here's the plan for **${weekLabel}**:\n\n${formatted}\n\nWhat would you like to change in this plan and why? (e.g., "Swap Thursday's endurance ride for intervals because I have a race on Sunday")`);
        setFlowData((prev) => ({ ...prev, plan, weekLabel }));
      }).catch(() => {
        addBotMessage(`Could not load the plan for ${rw === baseRw ? 'this' : 'next'} week. Please make sure a plan exists first.`);
        setFlowState(FLOW.IDLE);
      });
      return;
    }

    if (flowState === FLOW.OPT_CHANGES) {
      const validation = validateOptimizeReason(msg);
      const pd = flowData;

      setFlowState(FLOW.OPT_CONFIRM);
      setFlowData((prev) => ({ ...prev, changeRequest: msg, validation }));

      if (validation.valid) {
        addBotMessage(`${validation.note}\n\nBased on your request, I can adjust the plan. However, changing the plan may affect the weekly focus${pd.plan?.skeleton?.aim ? ` (${pd.plan.skeleton.aim})` : ''}.\n\nDo you want me to apply these changes? (Reply **Yes** or **No**)`);
      } else {
        addBotMessage(`I understand you want to make changes, but I need a bit more context on why. Could you share your reason? (e.g., injury, fatigue, race, work schedule, weather, etc.)`);
        setFlowState(FLOW.OPT_CHANGES);
      }
      return;
    }

    if (flowState === FLOW.OPT_CONFIRM) {
      const confirmed = lower === 'yes' || lower === 'y';
      if (confirmed) {
        const pd = flowData;
        const currentWorkouts = pd.plan?.workouts || [];
        const updatedPlan = {
          workouts: currentWorkouts,
          coachNotes: `Optimized based on: ${pd.changeRequest}. ${pd.validation?.note || ''}`,
          skeleton: pd.plan?.skeleton || null,
        };
        savePlan(pd.selectedWeek, updatedPlan).then((ok) => {
          if (ok) {
            addBotMessage(`✅ Done! The plan for ${pd.weekLabel} has been updated. You can view the changes in the calendar.\n\nThis plan aims to strike a balance between building your aerobic base and improving your anaerobic capacity. Remember to listen to your body and adjust the intensity and volume based on how you feel. Stay hydrated, fuel properly, and get enough rest. Let me know if you have any questions or need further adjustments.`);
          } else {
            addBotMessage('❌ Failed to save the updated plan. Please try again.');
          }
        });
      } else {
        addBotMessage('No changes made. Your plan remains as is. Let me know if you need anything else!');
      }
      setFlowState(FLOW.IDLE);
      setFlowData({});
      return;
    }

    // Fallback — shouldn't happen
    addBotMessage('Something went wrong with the optimization flow. Let me know if you want to start over with /optimize.');
    setFlowState(FLOW.IDLE);
    setFlowData({});
  };

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
    processMessage(msg);
  };

  const processMessage = (msg) => {
    if (!msg.trim()) return;

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

    const lower = msg.toLowerCase();

    // If in optimize flow, route to flow handler
    if (flowState !== FLOW.IDLE) {
      handleOptimizeMessage(msg);
      return;
    }

    // Handle local commands
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

    // Start optimize flow for /optimize or /optimize_<num>
    if (lower.startsWith('/optimize')) {
      setFlowState(FLOW.OPT_WEEK);
      setFlowData({});
      const userMsg = { id: Date.now(), sender: 'user', text: msg };
      setMessages((prev) => [...prev, userMsg]);
      addBotMessage('Which week would you like to optimize — **this week** or **next week**?');
      return;
    }

    sendToAgent(msg);
  };

  return (
    <>
      <motion.button
        className="fixed bottom-[max(2rem,env(safe-area-inset-bottom))] right-[max(1.5rem,env(safe-area-inset-right))] z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#FF5500] shadow-lg cursor-pointer md:bottom-8 md:right-8 md:h-16 md:w-16"
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
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl ${
              isMobile
                ? 'inset-x-3 bottom-[max(5.5rem,env(safe-area-inset-bottom))] top-[max(4.5rem,env(safe-area-inset-top))]'
                : isTablet && !isFullscreen
                  ? 'bottom-28 right-6 h-[min(560px,calc(100vh-8rem))] w-[min(420px,calc(100vw-3rem))]'
                  : ''
            } lg:bottom-28 lg:right-8 lg:inset-x-auto lg:top-auto ${
              isFullscreen ? 'lg:h-[85vh] lg:w-[90vw]' : 'lg:h-[560px] lg:w-[420px]'
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
