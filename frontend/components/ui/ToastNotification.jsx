"use client";

// frontend/components/ui/ToastNotification.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

let toastIdCounter = 0; // For unique race bib numbers

const ToastNotification = ({ message, type = 'info', duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [toastId] = useState(() => toastIdCounter++); // Assign unique ID

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) {
        // Allow animation to complete before calling onClose
        setTimeout(onClose, 300); // Adjust based on exit animation duration
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles = {
    success: {
      borderColor: 'border-success-green',
      prefix: 'SUCCESS',
    },
    error: {
      borderColor: 'border-error-red',
      prefix: 'ERROR',
    },
    info: {
      borderColor: 'border-info-blue',
      prefix: 'INFO',
    },
    // Add warning as specified in design system
    warning: {
      borderColor: 'border-warning-yellow',
      prefix: 'WARNING',
    },
  };

  const { borderColor, prefix } = typeStyles[type] || typeStyles.info;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.8 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
            mass: 0.5,
          }}
          className={`fixed bottom-4 right-4 p-4 pr-6 rounded-md shadow-lg bg-surface-cards border-l-8 ${borderColor}
                      flex items-center space-x-3 pointer-events-auto z-[9998] min-w-[280px] max-w-sm`}
          role="alert"
        >
          {/* Race Bib Number */}
          <div className="absolute top-1 right-2 text-text-muted font-jetbrainsMono text-sm opacity-70">
            #{String(toastId).padStart(3, '0')}
          </div>

          <div className="flex-shrink-0">
            {/* Icon based on type - Placeholder */}
            {type === 'success' && <span className="text-success-green">✔</span>}
            {type === 'error' && <span className="text-error-red">✖</span>}
            {type === 'info' && <span className="text-info-blue">ℹ</span>}
            {type === 'warning' && <span className="text-warning-yellow">⚠️</span>}
          </div>
          <div className="flex-1">
            <p className="font-bebasNeue text-sm uppercase text-text-secondary">
              {prefix}
            </p>
            <p className="font-dmSans text-text-primary text-base">
              {message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ToastNotification;
