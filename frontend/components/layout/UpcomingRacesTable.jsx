"use client";

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isPast } from 'date-fns';
import {
  formatRaceDate,
  formatRaceDistance,
  formatPriorityLabel,
  getPriorityBorderClass,
  getNutritionStatus,
  getRaceCountdown,
} from '../../lib/component-data';

const nutritionColor = {
  Generated: 'text-success-green',
  Pending: 'text-warning-yellow',
  'N/A': 'text-text-muted',
};

const UpcomingRacesTable = ({ races = [], onSelectRace }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  const upcomingRaces = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return [...races]
      .filter((r) => r.date && !r.completed && new Date(r.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [races]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-surface-cards rounded-lg p-6 border border-elevation-highlight"
    >
      <h2 className="font-bebasNeue text-2xl text-text-primary mb-4">Upcoming Races</h2>

      {upcomingRaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <p className="font-dmSans text-sm text-text-secondary">No upcoming races scheduled.</p>
          <p className="font-dmSans text-xs text-text-muted">Schedule a race to see it here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto lg:overflow-x-visible">
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
              {upcomingRaces.map((race) => {
                const raceId = race._id || race.id;
                const nutrition = getNutritionStatus(race);
                const passed = isPast(new Date(race.date));

                return (
                  <React.Fragment key={raceId}>
                    <motion.tr
                      className={`border-b border-elevation-highlight last:border-b-0 hover:bg-bg-dark transition-colors cursor-pointer ${getPriorityBorderClass(race.priority)}`}
                      onClick={() => setExpandedRow(expandedRow === raceId ? null : raceId)}
                      whileHover={{ backgroundColor: '#1A1C22' }}
                    >
                      <td className="py-3 px-2 text-text-primary md:px-4">{race.name || '—'}</td>
                      <td className="py-3 px-2 text-text-primary md:px-4 hidden md:table-cell">{race.type || '—'}</td>
                      <td className="py-3 px-2 text-text-primary md:px-4 hidden lg:table-cell">{race.location || '—'}</td>
                      <td className="py-3 px-2 text-text-primary md:px-4 hidden lg:table-cell">{formatRaceDistance(race.distance)}</td>
                      <td className="py-3 px-2 md:px-4">
                        <p className={passed ? 'text-text-muted' : 'text-text-primary'}>
                          {formatRaceDate(race.date)}
                        </p>
                        <p className={`text-xs font-jetbrainsMono ${passed ? 'text-error-red' : 'text-accent-orange'}`}>
                          {getRaceCountdown(race.date)}
                        </p>
                      </td>
                      <td className={`py-3 px-2 md:px-4 hidden lg:table-cell ${nutritionColor[nutrition] || 'text-text-muted'}`}>
                        {nutrition}
                      </td>
                      <td className="py-3 px-2 text-text-primary md:px-4">{formatPriorityLabel(race.priority)}</td>
                      <td className="py-3 px-2 md:px-4 hidden lg:table-cell">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRace?.(race);
                          }}
                          className="text-info-blue hover:underline text-sm"
                        >
                          Details
                        </button>
                      </td>
                    </motion.tr>
                    <AnimatePresence>
                      {expandedRow === raceId && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                          className="bg-bg-dark"
                        >
                          <td colSpan="8" className="p-4">
                            <div className="space-y-3">
                              {race.description && (
                                <div>
                                  <p className="font-bebasNeue text-text-primary text-lg">Description</p>
                                  <p className="font-dmSans text-text-secondary">{race.description}</p>
                                </div>
                              )}
                              {(race.story || race.aiSuggestions) && (
                                <div>
                                  <p className="font-bebasNeue text-text-primary text-lg">Goals & Notes</p>
                                  <p className="font-dmSans text-text-secondary">
                                    {race.story || (typeof race.aiSuggestions === 'string' ? race.aiSuggestions : '')}
                                  </p>
                                </div>
                              )}
                              {!race.description && !race.story && !race.aiSuggestions && (
                                <p className="font-dmSans text-sm text-text-muted">No additional details for this race.</p>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

export default UpcomingRacesTable;
