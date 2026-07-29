"use client";

import React, { useRef, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, useInView } from 'framer-motion';
import { buildPRProgressionData, formatPRTime } from '../../lib/component-data';

const PRProgressionChart = ({ bestEfforts, effortLabel }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  const { data, label, improvement } = useMemo(
    () => buildPRProgressionData(bestEfforts, effortLabel),
    [bestEfforts, effortLabel]
  );

  return (
    <motion.div
      ref={ref}
      className="relative bg-surface-cards rounded-lg p-6 overflow-hidden border border-elevation-highlight"
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <h2 className="font-bebasNeue text-2xl text-text-primary mb-4">
        PR Progression{label ? ` (${label})` : ''}
      </h2>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 gap-2">
          <p className="font-dmSans text-sm text-text-secondary">No personal records yet.</p>
          <p className="font-dmSans text-xs text-text-muted">Sync activities from Strava to track progression.</p>
        </div>
      ) : (
        <>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3B414B" />
                <XAxis dataKey="date" stroke="#8F9BB3" className="font-dmSans text-sm" />
                <YAxis
                  stroke="#8F9BB3"
                  className="font-dmSans text-sm"
                  domain={['dataMin - 10', 'dataMax + 10']}
                  reversed
                  tickFormatter={formatPRTime}
                  label={{ value: 'Time', angle: -90, position: 'insideLeft', fill: '#8F9BB3' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-bg-dark)', borderColor: 'var(--color-accent-orange)', borderRadius: '8px' }}
                  labelStyle={{ color: 'var(--color-accent-orange)', fontFamily: 'var(--font-dm-sans)' }}
                  itemStyle={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-dm-sans)' }}
                  formatter={(value) => formatPRTime(value)}
                />
                <Line
                  type="monotone"
                  dataKey="time"
                  stroke="#FFD700"
                  strokeWidth={3}
                  dot={{ stroke: '#FFD700', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 8, fill: '#FFD700', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {improvement != null && improvement > 0 && (
            <p className="font-dmSans text-text-secondary text-center mt-4">
              You&apos;ve improved by <span className="text-success-green">{improvement} seconds</span> over this period.
            </p>
          )}
        </>
      )}
    </motion.div>
  );
};

export default PRProgressionChart;
