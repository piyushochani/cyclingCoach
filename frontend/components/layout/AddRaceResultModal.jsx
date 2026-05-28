// frontend/components/layout/AddRaceResultModal.jsx
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CyclistLoader from '../animations/CyclistLoader';
import { api } from '../../lib/api';

const AddRaceResultModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    raceName: '',
    type: 'Road Race',
    date: '',
    time: '',
    position: '',
    totalRiders: '',
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
        type: formData.type,
        date: formData.date,
        time: formData.time,
        position: formData.position ? parseInt(formData.position, 10) : null,
        totalRiders: formData.totalRiders ? parseInt(formData.totalRiders, 10) : null,
        completed: true,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save result');
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
          className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-surface-cards p-8 rounded-lg shadow-xl w-full max-w-lg border border-elevation-highlight"
          >
            {isLoading && <CyclistLoader isLoading={isLoading} progress={progress} message="Adding Result..." />}
            <h2 className="font-bebasNeue text-3xl text-white mb-6">Add Race Result</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" name="raceName" placeholder="Race Name" value={formData.raceName} onChange={handleChange} className="w-full p-3 bg-bg-dark border border-chain-link-grey rounded" required />
              <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-3 bg-bg-dark border border-chain-link-grey rounded" required />
              <input type="text" name="time" placeholder="Finish Time (e.g. 4:12:00)" value={formData.time} onChange={handleChange} className="w-full p-3 bg-bg-dark border border-chain-link-grey rounded" />
              <input type="number" name="position" placeholder="Finishing Position" value={formData.position} onChange={handleChange} className="w-full p-3 bg-bg-dark border border-chain-link-grey rounded" required />
              <input type="number" name="totalRiders" placeholder="Total Riders" value={formData.totalRiders} onChange={handleChange} className="w-full p-3 bg-bg-dark border border-chain-link-grey rounded" />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={isLoading} className="w-full py-3 bg-accent-orange text-white font-bebasNeue rounded disabled:opacity-50">{isLoading ? 'Saving...' : 'Save Result'}</button>
            </form>
            <button onClick={onClose} className="mt-4 text-text-secondary">Cancel</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddRaceResultModal;
