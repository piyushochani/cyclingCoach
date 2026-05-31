"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../../../lib/api';

const startIcon = new Icon({
  iconUrl: '/icons/marker-start.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const endIcon = new Icon({
  iconUrl: '/icons/marker-end.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const SingleActivityPage = ({ params }) => {
  const { id } = params;
  const [activity, setActivity] = useState(null);
  const [showKudosAnimation, setShowKudosAnimation] = useState(false);

  useEffect(() => {
    api.get(`/activities/${id}`)
      .then(setActivity)
      .catch((err) => console.error('Failed to fetch activity:', err));
  }, [id]);

  if (!activity) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="font-dmSans text-text-secondary">Loading activity...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="container mx-auto p-4 md:p-8"
    >
      <div className="relative w-full h-[280px] rounded-lg overflow-hidden mb-8">
        {activity.route && activity.route.length > 0 && (
          <MapContainer
            center={activity.route[0]}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Polyline positions={activity.route} color="#FF6B00" weight={5} />
            <Marker position={activity.route[0]} icon={startIcon}>
              <Popup>Start</Popup>
            </Marker>
            <Marker position={activity.route[activity.route.length - 1]} icon={endIcon}>
              <Popup>End</Popup>
            </Marker>
          </MapContainer>
        )}
        <div className="absolute inset-0 bg-bg-dark/70 z-10 flex flex-col justify-end p-6">
          <h1 className="font-bebasNeue text-5xl text-text-primary uppercase">{activity.title || activity.name}</h1>
          <p className="font-dmSans text-lg text-text-secondary">{activity.date} - {activity.location}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-surface-cards rounded-lg p-4 text-center border border-elevation-highlight">
          <p className="font-bebasNeue text-2xl text-accent-orange">{typeof activity.distance === 'number' ? (activity.distance).toFixed(2) : activity.distance}</p>
          <p className="font-dmSans text-xs text-text-secondary">KM</p>
        </div>
        <div className="bg-surface-cards rounded-lg p-4 text-center border border-elevation-highlight">
          <p className="font-bebasNeue text-2xl text-text-primary">{activity.duration}</p>
          <p className="font-dmSans text-xs text-text-secondary">Duration</p>
        </div>
        <div className="bg-surface-cards rounded-lg p-4 text-center border border-elevation-highlight">
          <p className="font-bebasNeue text-2xl text-text-primary">{typeof activity.elevationGain === 'number' ? (activity.elevationGain).toFixed(2) : activity.elevationGain}</p>
          <p className="font-dmSans text-xs text-text-secondary">Elevation</p>
        </div>
        <div className="bg-surface-cards rounded-lg p-4 text-center border border-elevation-highlight">
          <p className="font-bebasNeue text-2xl text-text-primary">{typeof activity.avgSpeed === 'number' ? (activity.avgSpeed).toFixed(2) : activity.avgSpeed}</p>
          <p className="font-dmSans text-xs text-text-secondary">Avg Speed</p>
        </div>
        <div className="bg-surface-cards rounded-lg p-4 text-center border border-elevation-highlight">
          <p className="font-bebasNeue text-2xl text-text-primary">{activity.avgHR}</p>
          <p className="font-dmSans text-xs text-text-secondary">Avg HR</p>
        </div>
        <div className="bg-surface-cards rounded-lg p-4 text-center border border-elevation-highlight">
          <p className="font-bebasNeue text-2xl text-text-primary">{typeof activity.calories === 'number' ? (activity.calories).toFixed(2) : activity.calories}</p>
          <p className="font-dmSans text-xs text-text-secondary">Calories</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-surface-cards rounded-lg p-6 border border-elevation-highlight h-[400px]">
            <h2 className="font-bebasNeue text-xl text-text-primary mb-4">Activity Route</h2>
            {activity.route && activity.route.length > 0 && (
              <MapContainer
                center={activity.route[0]}
                zoom={13}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Polyline positions={activity.route} color="#FF6B00" weight={5} />
                <Marker position={activity.route[0]} icon={startIcon}>
                  <Popup>Start</Popup>
                </Marker>
                <Marker position={activity.route[activity.route.length - 1]} icon={endIcon}>
                  <Popup>End</Popup>
                </Marker>
              </MapContainer>
            )}
          </div>

          <div className="bg-surface-cards rounded-lg p-6 border border-elevation-highlight h-[300px]">
            <h2 className="font-bebasNeue text-xl text-text-primary mb-4">Elevation Profile</h2>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={activity.elevationProfile}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3B414B" />
                <XAxis dataKey="distance" stroke="#8F9BB3" label={{ value: 'Distance (KM)', position: 'insideBottomRight', offset: -10, fill: '#8F9BB3' }} />
                <YAxis dataKey="elevation" stroke="#8F9BB3" label={{ value: 'Elevation (M)', angle: -90, position: 'insideLeft', fill: '#8F9BB3' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-bg-dark)', borderColor: 'var(--color-accent-orange)', borderRadius: '8px' }}
                  labelStyle={{ color: 'var(--color-accent-orange)', fontFamily: 'var(--font-dm-sans)' }}
                  itemStyle={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-dm-sans)' }}
                />
                <Line type="monotone" dataKey="elevation" stroke="#3498DB" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-surface-cards rounded-lg p-6 border border-elevation-highlight">
            <h2 className="font-bebasNeue text-xl text-text-primary mb-4">Splits</h2>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="min-w-full text-left text-sm font-dmSans">
                <thead>
                  <tr className="border-b border-elevation-highlight">
                    <th className="py-2 px-4 text-text-secondary">KM</th>
                    <th className="py-2 px-4 text-text-secondary">Time</th>
                    <th className="py-2 px-4 text-text-secondary">Avg Speed</th>
                    <th className="py-2 px-4 text-text-secondary">Elevation</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.splits && activity.splits.map((split, index) => (
                    <tr key={index} className="border-b border-elevation-highlight last:border-b-0 hover:bg-bg-dark">
                      <td className="py-2 px-4 text-text-primary">{split.km}</td>
                      <td className="py-2 px-4 text-text-primary">{split.time}</td>
                      <td className="py-2 px-4 text-text-primary">{split.avgSpeed}</td>
                      <td className="py-2 px-4 text-text-primary">{split.elevation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <div className="bg-surface-cards rounded-lg p-6 border border-elevation-highlight text-center">
            <h2 className="font-bebasNeue text-xl text-text-primary mb-4">Performance Score</h2>
            <div className="w-32 h-32 mx-auto rounded-full bg-bg-dark flex items-center justify-center text-accent-orange font-bebasNeue text-4xl">
              {activity.performanceScore}
            </div>
          </div>

          <div className="bg-surface-cards rounded-lg p-6 border border-elevation-highlight h-[300px]">
            <h2 className="font-bebasNeue text-xl text-text-primary mb-4">Power / Heart Rate</h2>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={activity.elevationProfile || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3B414B" />
                <XAxis dataKey="distance" hide />
                <YAxis yAxisId="left" stroke="#FF6B00" orientation="left" label={{ value: 'Power', angle: -90, position: 'insideLeft', fill: '#FF6B00' }} />
                <YAxis yAxisId="right" stroke="#E74C3C" orientation="right" label={{ value: 'HR', angle: 90, position: 'insideRight', fill: '#E74C3C' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-bg-dark)', borderColor: 'var(--color-accent-orange)', borderRadius: '8px' }}
                  labelStyle={{ color: 'var(--color-accent-orange)', fontFamily: 'var(--font-dm-sans)' }}
                  itemStyle={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-dm-sans)' }}
                />
                <Line yAxisId="left" type="monotone" dataKey="elevation" stroke="#FF6B00" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="elevation" stroke="#E74C3C" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-surface-cards rounded-lg p-6 border border-elevation-highlight">
            <h2 className="font-bebasNeue text-xl text-text-primary mb-4">Segments</h2>
            <div className="space-y-3">
              {activity.segments && activity.segments.map((segment, index) => (
                <div key={index} className="flex justify-between items-center bg-bg-dark p-3 rounded-md border border-chain-link-grey">
                  <div>
                    <p className="font-dmSans text-text-primary">{segment.name}</p>
                    <p className="font-dmSans text-sm text-text-secondary">PR: {segment.pr} (Best: {segment.best})</p>
                  </div>
                  <span className="bg-podium-gold text-bg-dark text-xs px-2 py-1 rounded-full font-bebasNeue">PR!</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-cards rounded-lg p-6 border border-elevation-highlight">
            <h2 className="font-bebasNeue text-xl text-text-primary mb-4">Engagement</h2>
            <div className="flex items-center space-x-4 mb-4">
              <motion.button
                className="flex items-center space-x-1 text-text-secondary hover:text-accent-orange"
                onClick={() => setShowKudosAnimation(true)}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                <span>Give Kudos</span>
              </motion.button>
              {showKudosAnimation && (
                <motion.span
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: -20 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  onAnimationComplete={() => setShowKudosAnimation(false)}
                  className="text-accent-orange font-bebasNeue text-lg absolute"
                >
                  +1
                </motion.span>
              )}
            </div>
            <textarea
              className="w-full p-3 rounded-md bg-bg-dark text-text-primary border border-chain-link-grey focus:border-accent-orange focus:ring-1 focus:ring-accent-orange outline-none"
              placeholder="Add a comment..."
              rows="3"
            ></textarea>
            <button className="mt-3 px-4 py-2 bg-accent-orange text-white rounded-md font-dmSans text-sm hover:bg-orange-600">
              Post Comment
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SingleActivityPage;
