// frontend/components/layout/ScheduleRaceModal.jsx
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CyclistLoader from '../animations/CyclistLoader';
import { api } from '../../lib/api';

const ScheduleRaceModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    raceName: '',
    raceType: 'Road Race',
    date: '',
    location: '',
    distance: '',
    elevation: '',
    priority: 'Medium',
    conditions: 'Clear',
    description: '',
    goal: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await api.post('/races', {
        name: formData.raceName,
        type: formData.raceType,
        date: formData.date,
        location: formData.location,
        distance: parseFloat(formData.distance) || 0,
        elevationGain: parseFloat(formData.elevation) || 0,
        priority: formData.priority === 'A-Race' ? 'A' : formData.priority.charAt(0),
        weather: formData.conditions,
        description: formData.description,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to schedule race');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
        >
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="relative w-full max-w-2xl bg-surface-cards rounded-lg shadow-xl border-l-8 border-accent-orange p-6 md:p-8 overflow-y-auto max-h-[90vh]"
          >
            {isLoading && (
              <CyclistLoader isLoading={isLoading} progress={progress} message="Setting Race Target..." />
            )}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-text-secondary hover:text-accent-orange transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            <h2 className="font-bebasNeue text-4xl text-text-primary mb-6 text-center">
              SCHEDULE <span className="text-accent-orange">NEW RACE</span>
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Race Name */}
              <div>
                <label htmlFor="raceName" className="block text-sm font-dmSans text-text-secondary mb-2">Race Name</label>
                <input type="text" id="raceName" name="raceName" value={formData.raceName} onChange={handleChange} required
                       className="w-full p-3 rounded-md bg-bg-dark text-text-primary border border-chain-link-grey focus:border-accent-orange focus:ring-1 focus:ring-accent-orange outline-none" />
              </div>
              {/* Race Type */}
              <div>
                <label htmlFor="raceType" className="block text-sm font-dmSans text-text-secondary mb-2">Race Type</label>
                <select id="raceType" name="raceType" value={formData.raceType} onChange={handleChange}
                        className="w-full p-3 rounded-md bg-bg-dark text-text-primary border border-chain-link-grey focus:border-accent-orange focus:ring-1 focus:ring-accent-orange outline-none">
                  <option>Road Race</option>
                  <option>Time Trial</option>
                  <option>Crit</option>
                  <option>MTB</option>
                  <option>Gravel</option>
                  <option>Triathlon</option>
                  <option>Duathlon</option>
                </select>
              </div>
              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-dmSans text-text-secondary mb-2">Date</label>
                <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required
                       className="w-full p-3 rounded-md bg-bg-dark text-text-primary border border-chain-link-grey focus:border-accent-orange focus:ring-1 focus:ring-accent-orange outline-none" />
              </div>
              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-dmSans text-text-secondary mb-2">Location</label>
                <input type="text" id="location" name="location" value={formData.location} onChange={handleChange}
                       className="w-full p-3 rounded-md bg-bg-dark text-text-primary border border-chain-link-grey focus:border-accent-orange focus:ring-1 focus:ring-accent-orange outline-none" />
              </div>
              {/* Distance */}
              <div>
                <label htmlFor="distance" className="block text-sm font-dmSans text-text-secondary mb-2">Distance (KM)</label>
                <input type="number" id="distance" name="distance" value={formData.distance} onChange={handleChange}
                       className="w-full p-3 rounded-md bg-bg-dark text-text-primary border border-chain-link-grey focus:border-accent-orange focus:ring-1 focus:ring-accent-orange outline-none" />
              </div>
              {/* Elevation */}
              <div>
                <label htmlFor="elevation" className="block text-sm font-dmSans text-text-secondary mb-2">Elevation (M)</label>
                <input type="number" id="elevation" name="elevation" value={formData.elevation} onChange={handleChange}
                       className="w-full p-3 rounded-md bg-bg-dark text-text-primary border border-chain-link-grey focus:border-accent-orange focus:ring-1 focus:ring-accent-orange outline-none" />
              </div>
              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block text-sm font-dmSans text-text-secondary mb-2">Priority</label>
                <select id="priority" name="priority" value={formData.priority} onChange={handleChange}
                        className="w-full p-3 rounded-md bg-bg-dark text-text-primary border border-chain-link-grey focus:border-accent-orange focus:ring-1 focus:ring-accent-orange outline-none">
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>A-Race</option>
                </select>
              </div>
              {/* Conditions */}
              <div>
                <label htmlFor="conditions" className="block text-sm font-dmSans text-text-secondary mb-2">Expected Conditions</label>
                <input type="text" id="conditions" name="conditions" value={formData.conditions} onChange={handleChange}
                       className="w-full p-3 rounded-md bg-bg-dark text-text-primary border border-chain-link-grey focus:border-accent-orange focus:ring-1 focus:ring-accent-orange outline-none" />
              </div>
              {/* Description */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-dmSans text-text-secondary mb-2">Description</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="3"
                          className="w-full p-3 rounded-md bg-bg-dark text-text-primary border border-chain-link-grey focus:border-accent-orange focus:ring-1 focus:ring-accent-orange outline-none"></textarea>
              </div>
              {/* Goal */}
              <div className="md:col-span-2">
                <label htmlFor="goal" className="block text-sm font-dmSans text-text-secondary mb-2">Race Goal</label>
                <textarea id="goal" name="goal" value={formData.goal} onChange={handleChange} rows="2"
                          className="w-full p-3 rounded-md bg-bg-dark text-text-primary border border-chain-link-grey focus:border-accent-orange focus:ring-1 focus:ring-accent-orange outline-none"></textarea>
              </div>

              {error && <p className="md:col-span-2 text-red-400 text-sm text-center">{error}</p>}

              {/* Submit Button */}
              <div className="md:col-span-2 flex justify-center mt-4">
                <motion.button
                  type="submit"
                  className="skew-x-[-15deg] px-10 py-4 bg-accent-orange text-white font-dmSans text-xl relative group overflow-hidden shadow-lg"
                  whileHover={{ scale: 1.02, backgroundColor: '#E55C00' }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                >
                  <span className="block skew-x-[15deg] group-hover:skew-x-0 transition-transform duration-300">
                    {isLoading ? 'Saving...' : 'LOCK IN TARGET'} &rarr;
                  </span>
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScheduleRaceModal;
