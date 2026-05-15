'use client';

import { useState } from 'react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    ftp: 200,
    weight: 70,
    height: 175,
    yearsInCycling: 2,
  });

  const handleSync = async () => {
    alert('Syncing to Coach... (Pinecone update triggered)');
    // In a real implementation, this would call an API route that uses EmbeddingSync
  };

  const handleStravaConnect = () => {
    alert('Redirecting to Strava OAuth...');
    // window.location.href = '/api/auth/signin/strava';
  };

  return (
    <main>
      <h1>Dashboard</h1>
      <p style={{ color: 'var(--secondary)' }}>Manage your coaching data and connectivity.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
        <div className="card">
          <h2>Connectivity</h2>
          <p>Connect your Strava account to sync your latest activities.</p>
          <button 
            onClick={handleStravaConnect}
            className="button" 
            style={{ marginTop: '1rem', backgroundColor: '#fc4c02' }}
          >
            Connect Strava
          </button>
        </div>

        <div className="card">
          <h2>Cycling Stats</h2>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <label>
              FTP (Watts)
              <input 
                type="number" 
                value={stats.ftp} 
                onChange={e => setStats({...stats, ftp: Number(e.target.value)})}
                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
              />
            </label>
            <label>
              Weight (kg)
              <input 
                type="number" 
                value={stats.weight} 
                onChange={e => setStats({...stats, weight: Number(e.target.value)})}
                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
              />
            </label>
            <label>
              Height (cm)
              <input 
                type="number" 
                value={stats.height} 
                onChange={e => setStats({...stats, height: Number(e.target.value)})}
                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
              />
            </label>
            <label>
              Years in Cycling
              <input 
                type="number" 
                value={stats.yearsInCycling} 
                onChange={e => setStats({...stats, yearsInCycling: Number(e.target.value)})}
                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
              />
            </label>
            <button 
              type="button"
              onClick={handleSync}
              className="button" 
              style={{ marginTop: '1rem' }}
            >
              Sync to Coach
            </button>
          </form>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2>Training Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>Last 7 Days</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>12.5h</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>Fitness</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>85</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>Fatigue</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>92</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>Form</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'red' }}>-7</p>
          </div>
        </div>
      </div>
    </main>
  );
}
