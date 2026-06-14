// frontend/components/layout/UpcomingRacesTable.jsx
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isPast } from 'date-fns';

const dummyRaces = [
  {
    id: 'r1',
    name: 'Ironman France',
    type: 'Triathlon',
    location: 'Nice, France',
    distance: '226 km',
    date: '2024-06-25',
    nutritionPlan: 'Generated',
    priority: 'A-Race',
    description: 'The iconic Ironman in Nice. Challenging bike course, beautiful run.',
    aiNotes: 'Focus on brick workouts. Hydration strategy critical on bike. Practice open water swim starts.',
  },
  {
    id: 'r2',
    name: "Alpe d'Huez Cycling Race",
    type: 'Road Race',
    location: "Alpe d'Huez, France",
    distance: '100 km',
    date: '2024-07-14',
    nutritionPlan: 'Pending',
    priority: 'High',
    description: 'Classic climb with 21 hairpins. Need to manage effort well.',
    aiNotes: 'Simulate climb profile in training. Cadence drills. Fueling strategy per hour.',
  },
  {
    id: 'r3',
    name: 'Local Crit Series #3',
    type: 'Crit',
    location: 'Denver, CO',
    distance: '40 km',
    date: '2024-05-01', // Past date for testing
    nutritionPlan: 'N/A',
    priority: 'Low',
    description: 'Fast local crit, good for speed work.',
    aiNotes: 'Work on cornering speed and sprint finishes.',
  },
];

const UpcomingRacesTable = () => {
  const [expandedRow, setExpandedRow] = useState(null);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'A-Race': return 'border-l-4 border-podium-gold';
      case 'High': return 'border-l-4 border-error-red';
      case 'Medium': return 'border-l-4 border-accent-orange';
      case 'Low': return 'border-l-4 border-info-blue';
      default: return '';
    }
  };

  const getNutritionStatusColor = (status) => {
    switch (status) {
      case 'Generated': return 'text-success-green';
      case 'Pending': return 'text-warning-yellow';
      default: return 'text-text-muted';
    }
  };

  const calculateCountdown = (raceDate) => {
    const now = new Date();
    const targetDate = new Date(raceDate);
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Race Passed';
    if (diffDays === 0) return 'Today!';
    return `${diffDays} days`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-surface-cards rounded-lg p-6 border border-elevation-highlight"
    >
      <h2 className="font-bebasNeue text-2xl text-text-primary mb-4">Upcoming Races</h2>
      <div className="overflow-x-hidden">
        <table className="w-full text-left text-sm font-dmSans">
          <thead>
            <tr className="border-b border-elevation-highlight">
              <th className="py-3 px-2 text-text-secondary md:px-4">Race Name</th>
              <th className="py-3 px-2 text-text-secondary md:px-4 hidden md:table-cell">Type</th>
              <th className="py-3 px-2 text-text-secondary md:px-4 hidden lg:table-cell">Location</th>
              <th className="py-3 px-2 text-text-secondary md:px-4 hidden lg:table-cell">Distance</th>
              <th className="py-3 px-2 text-text-secondary md:px-4">Date / Countdown</th>
              <th className="py-3 px-2 text-text-secondary md:px-4 hidden lg:table-cell">Nutrition</th>
              <th className="py-3 px-2 text-text-secondary md:px-4">Priority</th>
              <th className="py-3 px-2 text-text-secondary md:px-4 hidden lg:table-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {dummyRaces.map((race) => (
              <React.Fragment key={race.id}>
                <motion.tr
                  className={`border-b border-elevation-highlight last:border-b-0 hover:bg-bg-dark transition-colors cursor-pointer ${getPriorityColor(race.priority)}`}
                  onClick={() => setExpandedRow(expandedRow === race.id ? null : race.id)}
                  whileHover={{ backgroundColor: '#1A1C22' }}
                >
                  <td className="py-3 px-2 text-text-primary md:px-4">{race.name}</td>
                  <td className="py-3 px-2 text-text-primary md:px-4 hidden md:table-cell">{race.type}</td>
                  <td className="py-3 px-2 text-text-primary md:px-4 hidden lg:table-cell">{race.location}</td>
                  <td className="py-3 px-2 text-text-primary md:px-4 hidden lg:table-cell">{race.distance}</td>
                  <td className="py-3 px-2 md:px-4">
                    <p className={isPast(new Date(race.date)) ? 'text-text-muted' : 'text-text-primary'}>
                      {format(new Date(race.date), 'MMM dd, yyyy')}
                    </p>
                    <p className={`text-xs font-jetbrainsMono ${isPast(new Date(race.date)) ? 'text-error-red' : 'text-accent-orange'}`}>
                      {calculateCountdown(race.date)}
                    </p>
                  </td>
                  <td className={`py-3 px-2 md:px-4 hidden lg:table-cell ${getNutritionStatusColor(race.nutritionPlan)}`}>{race.nutritionPlan}</td>
                  <td className="py-3 px-2 text-text-primary md:px-4">{race.priority}</td>
                  <td className="py-3 px-2 md:px-4 hidden lg:table-cell">
                    <button className="text-info-blue hover:underline text-sm">Details</button>
                  </td>
                </motion.tr>
                <AnimatePresence>
                  {expandedRow === race.id && (
                    <motion.tr
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="bg-bg-dark"
                    >
                      <td colSpan="8" className="p-4">
                        <div className="space-y-3">
                          <div>
                            <p className="font-bebasNeue text-text-primary text-lg">Description:</p>
                            <p className="font-dmSans text-text-secondary">{race.description}</p>
                          </div>
                          <div>
                            <p className="font-bebasNeue text-text-primary text-lg">AI Notes:</p>
                            <p className="font-dmSans text-text-secondary">{race.aiNotes}</p>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default UpcomingRacesTable;
