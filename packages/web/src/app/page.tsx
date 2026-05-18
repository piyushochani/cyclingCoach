export default function Home() {
  return (
    <main>
      <section style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h1>Welcome to EndurAgent</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--secondary)', marginBottom: '2rem' }}>
          Your AI-powered cycling coach for personalized training plans and performance analysis.
        </p>
        <a href="/dashboard" className="button">Go to Dashboard</a>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
        <div className="card">
          <h2>Personalized Plans</h2>
          <p>Training plans that adapt to your fitness level, goals, and schedule.</p>
        </div>
        <div className="card">
          <h2>AI Performance Analysis</h2>
          <p>Get deep insights into your rides with our advanced AI analysis tools.</p>
        </div>
        <div className="card">
          <h2>Seamless Integration</h2>
          <p>Connects with Strava, Garmin, and Intervals.icu to sync your data.</p>
        </div>
      </div>
    </main>
  );
}
