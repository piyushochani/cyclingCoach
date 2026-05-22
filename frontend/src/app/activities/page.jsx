"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '../../../lib/api';

const ActivityCard = ({ activity, index }) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { delay: index * 0.1 } },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="bg-surface-cards rounded-lg p-4 shadow-lg border border-elevation-highlight
                 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4
                 group hover:border-accent-orange transition-all duration-300"
    >
      {/* Sport Icon (Placeholder) */}
      <div className="flex-shrink-0 w-12 h-12 bg-bg-dark rounded-full flex items-center justify-center text-text-primary text-2xl">
        🚲
      </div>

      <div className="flex-1 text-center md:text-left">
        <Link href={`/activities/${activity.id}`}>
          <h3 className="font-bebasNeue text-xl text-text-primary hover:text-accent-orange cursor-pointer">
            {activity.title || activity.name}
          </h3>
        </Link>
        <p className="font-dmSans text-sm text-text-secondary">{activity.date} - {activity.sport}</p>
        <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
          <span className="bg-bg-dark text-text-muted text-xs px-2 py-1 rounded-full">{activity.distance} km</span>
          <span className="bg-bg-dark text-text-muted text-xs px-2 py-1 rounded-full">{activity.duration || `${Math.floor(activity.durationSeconds / 3600)}h ${Math.floor((activity.durationSeconds % 3600) / 60)}m`}</span>
          <span className="bg-bg-dark text-text-muted text-xs px-2 py-1 rounded-full">{activity.elevation || activity.elevationGain} m</span>
        </div>
      </div>

      {/* Mini Elevation Profile (Placeholder SVG) */}
      <div className="flex-shrink-0 w-24 h-12">
        <svg viewBox="0 0 100 50" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full text-accent-orange">
          <path d="M0 40 L20 20 L40 30 L60 10 L80 25 L100 15" />
        </svg>
      </div>

      {/* Action Buttons (Placeholder) */}
      <div className="flex-shrink-0 flex space-x-2">
        <button className="text-text-secondary hover:text-info-blue transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
        </button>
        <button className="text-text-secondary hover:text-success-green transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.013 9.726 11 10.819 11h2.362c1.092 0 1.933 1.013 2.135 2.342m-4.27 0v2.793m0 0a.944.944 0 00-.945.945.945.945 0 00.945.945.945.945 0 00.945-.945.945.945 0 00-.945-.945zm0-2.793V3m-5 4h.01M17 7h.01M5 12h.01M19 12h.01M5 17h.01M19 17h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z"></path></svg>
        </button>
      </div>
    </motion.div>
  );
};
const ActivitiesPage = () => {
  const [activities, setActivities] = useState([]);
  const [filterSport, setFilterSport] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All Time');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('Newest');

  useEffect(() => {
    api.get('/activities')
      .then(setActivities)
      .catch((err) => console.error('Failed to load activities:', err));
  }, []);

  const filteredActivities = activities.filter(activity => {
    return (filterSport === 'All' || activity.sport === filterSport) &&
           (activity.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  }).sort((a, b) => {
    if (sortOrder === 'Newest') return new Date(b.date) - new Date(a.date);
    if (sortOrder === 'Oldest') return new Date(a.date) - new Date(b.date);
    return 0;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="container mx-auto p-4 md:p-8"
    >
      <h1 className="font-bebasNeue text-4xl text-text-primary mb-8 relative">
        YOUR <span className="text-accent-orange">STAGES</span>
        {/* Bicycle wheel SVG watermark */}
        <svg
          className="absolute top-1/2 left-0 -translate-y-1/2 w-48 h-48 text-surface-cards opacity-10"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="1" />
          {/* Spokes - simplified */}
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={i}
              x1="50"
              y1="50"
              x2={50 + 45 * Math.cos(i * Math.PI / 4)}
              y2={50 + 45 * Math.sin(i * Math.PI / 4)}
              stroke="currentColor"
              strokeWidth="0.5"
            />
          ))}
        </svg>
      </h1>

      {/* Filter Bar */}
      <div className="bg-surface-cards p-4 rounded-lg shadow-md mb-8 flex flex-wrap gap-4 items-center">
        {/* Sport Dropdown */}
        <select
          className="bg-bg-dark text-text-primary border border-chain-link-grey rounded-md p-2"
          value={filterSport}
          onChange={(e) => setFilterSport(e.target.value)}
        >
          <option>All</option>
          <option>Cycling</option>
          <option>Running</option>
          <option>Swimming</option>
        </select>
        {/* Date Range Dropdown */}
        <select
          className="bg-bg-dark text-text-primary border border-chain-link-grey rounded-md p-2"
          value={filterDateRange}
          onChange={(e) => setFilterDateRange(e.target.value)}
        >
          <option>All Time</option>
          <option>Last 30 Days</option>
          <option>This Year</option>
        </select>
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search activities..."
          className="bg-bg-dark text-text-primary border border-chain-link-grey rounded-md p-2 flex-grow"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Sort Tabs */}
      <div className="flex space-x-4 mb-8">
        {['Newest', 'Oldest', 'Distance'].map((option) => (
          <button
            key={option}
            onClick={() => setSortOrder(option)}
            className={`px-4 py-2 rounded-full font-dmSans text-sm transition-colors
              ${sortOrder === option ? 'bg-accent-orange text-white' : 'bg-bg-dark text-text-secondary hover:text-accent-orange'}`}
          >
            {option}
            {/* Chainring tooth icon placeholder */}
            {sortOrder === option && <span className="ml-2">⚙️</span>}
          </button>
        ))}
      </div>

      {/* Activity Count Chip */}
      <p className="font-dmSans text-text-secondary text-lg mb-6">
        Showing {filteredActivities.length} activities
      </p>

      {/* Activities List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity, index) => (
            <ActivityCard key={activity.id} activity={activity} index={index} />
          ))
        ) : (
          <p className="text-text-secondary text-center">No activities found.</p>
        )}
      </div>

      {/* Load More Button (Placeholder) */}
      {filteredActivities.length > 0 && (
        <motion.button
          className="mt-8 mx-auto block px-6 py-3 bg-accent-orange text-white rounded-md font-dmSans text-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Load More Stages
        </motion.button>
      )}
    </motion.div>
  );
};

export default ActivitiesPage;
