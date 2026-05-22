// frontend/components/ui/PaceBotChat.jsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PaceBotChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setTimeout(() => {
        setMessages([
          {
            id: 1,
            sender: 'bot',
            text: "Hey there, rider! I'm PaceBot, your AI cycling coach. How can I help you today?",
          },
        ]);
      }, 500);
    }
  }, [isOpen, messages.length]);

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      setMessages((prev) => [...prev, { id: Date.now(), sender: 'user', text: inputMessage }]);
      setInputMessage('');
      // Simulate bot response
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, sender: 'bot', text: 'Great question! Let me check on that for you...' },
        ]);
      }, 1500);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full bg-accent-orange shadow-lg flex items-center justify-center cursor-pointer"
        whileHover={{ scale: 1.1, boxShadow: '0 0 15px rgba(255, 107, 0, 0.7)' }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Bicycle Helmet SVG Placeholder */}
        <svg
          className="w-8 h-8 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a10 10 0 0 0-8 4v8c0 2.21 1.79 4 4 4h8a4 4 0 0 0 4-4V6a10 10 0 0 0-8-4z" />
          <path d="M12 18h.01" />
        </svg>
      </motion.button>

      {/* Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 300 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 300 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="fixed bottom-28 right-8 z-50 w-80 h-[400px] bg-surface-cards rounded-lg shadow-xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-elevation-highlight p-4 flex items-center justify-between">
              <h3 className="font-bebasNeue text-xl text-text-primary">PaceBot AI</h3>
              <button onClick={() => setIsOpen(false)} className="text-text-secondary hover:text-accent-orange">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex mb-4 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-accent-orange flex items-center justify-center mr-2">
                      <span className="text-white text-sm font-bold">AI</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      msg.sender === 'user'
                        ? 'bg-accent-orange text-white rounded-br-none'
                        : 'bg-elevation-highlight text-text-primary rounded-bl-none'
                    }`}
                  >
                    <p className="font-dmSans text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
              {/* Typing indicator placeholder */}
              {/* <div className="flex items-center space-x-1">
                <motion.svg className="w-4 h-4 text-text-muted" viewBox="0 0 100 100" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" /></motion.svg>
                <motion.svg className="w-4 h-4 text-text-muted" viewBox="0 0 100 100" animate={{ rotate: 360, delay: 0.2 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" /></motion.svg>
                <motion.svg className="w-4 h-4 text-text-muted" viewBox="0 0 100 100" animate={{ rotate: 360, delay: 0.4 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" /></motion.svg>
              </div> */}
            </div>

            {/* Input Area */}
            <div className="border-t border-elevation-highlight p-4 flex items-center">
              <input
                type="text"
                placeholder="Ask PaceBot..."
                className="flex-1 p-2 rounded-md bg-bg-dark text-text-primary border border-chain-link-grey focus:border-accent-orange focus:ring-1 focus:ring-accent-orange outline-none"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                className="ml-2 px-4 py-2 bg-accent-orange text-white rounded-md hover:bg-orange-600 transition-colors"
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PaceBotChat;
