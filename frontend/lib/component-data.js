import { fmtDist, fmtDuration, fmtElev, fmtTime } from './format';

/** Activity distance from API is stored in meters. */
export function activityDistanceKm(activity) {
  const d = activity?.distance;
  if (d == null || Number.isNaN(Number(d))) return 0;
  return Number(d) / 1000;
}

export function getUserDisplayName(user) {
  if (!user) return 'Athlete';
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length) return parts.join(' ');
  if (user.name) return user.name;
  return 'Athlete';
}

export function getUserInitials(user) {
  const name = getUserDisplayName(user);
  const initials = name
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return initials || 'AT';
}

export function formatExperienceLevel(level) {
  if (!level) return 'Beginner';
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function formatSportLabel(sport) {
  if (!sport) return 'Cyclist';
  const s = sport.toLowerCase();
  if (s === 'cycling') return 'Cyclist';
  return sport.charAt(0).toUpperCase() + sport.slice(1);
}

export function formatRaceDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatRaceDistance(km) {
  if (km == null || km === '' || Number.isNaN(Number(km))) return '—';
  const n = Number(km);
  return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)} km`;
}

export function formatPriorityLabel(priority) {
  if (!priority) return '—';
  const p = String(priority).toUpperCase();
  if (p === 'A') return 'A-Race';
  if (p === 'B') return 'High';
  if (p === 'C') return 'Medium';
  if (p === 'D') return 'Low';
  return priority;
}

export function getPriorityBorderClass(priority) {
  const p = String(priority || '').toUpperCase();
  switch (p) {
    case 'A':
    case 'A-RACE':
      return 'border-l-4 border-podium-gold';
    case 'B':
    case 'HIGH':
      return 'border-l-4 border-error-red';
    case 'C':
    case 'MEDIUM':
      return 'border-l-4 border-accent-orange';
    case 'D':
    case 'LOW':
      return 'border-l-4 border-info-blue';
    default:
      return '';
  }
}

export function getNutritionStatus(race) {
  if (race?.raceNutrition || race?.dietPlan) return 'Generated';
  if (race?.completed) return 'N/A';
  return 'Pending';
}

export function getRaceCountdown(date) {
  const now = new Date();
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return '—';
  const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Race Passed';
  if (diffDays === 0) return 'Today!';
  return `${diffDays} days`;
}

export function getOrdinalSuffix(n) {
  const num = Number(n);
  if (!num || Number.isNaN(num)) return '';
  const mod10 = num % 10;
  const mod100 = num % 100;
  if (mod10 === 1 && mod100 !== 11) return 'ST';
  if (mod10 === 2 && mod100 !== 12) return 'ND';
  if (mod10 === 3 && mod100 !== 13) return 'RD';
  return 'TH';
}

export function formatFinishPosition(position, totalRiders) {
  if (!position) return '—';
  const suffix = getOrdinalSuffix(position);
  const base = `${position}${suffix ? ` ${suffix}` : ''}`;
  if (totalRiders) return `${base} of ${totalRiders}`;
  return base;
}

export function mapActivitiesToChartEntries(activities = []) {
  return activities
    .filter((a) => a?.date)
    .map((a) => ({
      date: new Date(a.date).toISOString().slice(0, 10),
      distanceKm: activityDistanceKm(a),
      timeMin: Math.round((a.durationSeconds || 0) / 60),
      elevGainM: Math.round(a.elevationGain || 0),
    }));
}

export function computeSeasonSummary(races = []) {
  const completed = races.filter((r) => r.completed !== false && r.position);
  const allRaces = races.length ? races : [];
  const positions = allRaces.map((r) => r.position).filter((p) => p != null && !Number.isNaN(Number(p)));
  const best = positions.length ? Math.min(...positions) : null;
  const totalDist = allRaces.reduce((s, r) => s + (parseFloat(r.distance) || 0), 0);
  const totalElev = allRaces.reduce((s, r) => s + (parseFloat(r.elevationGain) || 0), 0);
  const podiums = allRaces.filter((r) => r.position && r.position <= 3).length;

  return [
    { label: 'Total Races', value: allRaces.length },
    {
      label: 'Best Finish',
      value: best != null ? `${best}${getOrdinalSuffix(best).toLowerCase()}` : '—',
    },
    { label: 'Total Race km', value: totalDist % 1 === 0 ? totalDist.toFixed(0) : totalDist.toFixed(1) },
    { label: 'Total Race Elevation', value: totalElev >= 1000 ? `${(totalElev / 1000).toFixed(1)}k m` : `${Math.round(totalElev)} m` },
    { label: 'Podiums', value: podiums },
  ];
}

export function computeRaceBadges(stats, activities = [], races = []) {
  const badges = [];
  const totalKm = stats?.totalDistance ? stats.totalDistance / 1000 : activities.reduce((s, a) => s + activityDistanceKm(a), 0);
  const century = activities.some((a) => activityDistanceKm(a) >= 100);
  const highElev = activities.some((a) => (a.elevationGain || 0) >= 2000);
  const wins = races.filter((r) => r.position === 1).length;
  const podiums = races.filter((r) => r.position && r.position <= 3).length;

  if (century) badges.push({ name: 'First Century', icon: '🏅', earned: true });
  if (highElev) badges.push({ name: 'Alps Conqueror', icon: '🏔️', earned: true });
  if (stats?.longestRide && stats.longestRide / 1000 >= 50) badges.push({ name: 'Long Rider', icon: '🚴', earned: true });
  if (totalKm >= 1000) badges.push({ name: '1000km Club', icon: '⚡', earned: true });
  if (wins >= 1) badges.push({ name: 'Race Winner', icon: '🥇', earned: true });
  if (podiums >= 3) badges.push({ name: 'Podium Hunter', icon: '🏆', earned: true });

  if (badges.length === 0) {
    return [
      { name: 'First Ride', icon: '🚴', earned: (stats?.activityCount || activities.length) > 0 },
      { name: 'Century', icon: '🏅', earned: false },
      { name: '1000km Club', icon: '⚡', earned: false },
      { name: 'Podium', icon: '🏆', earned: false },
    ];
  }
  return badges;
}

export function buildPRProgressionData(bestEfforts, preferredLabel) {
  const efforts = bestEfforts?.bestEfforts || [];
  if (!efforts.length) return { data: [], label: null, improvement: null };

  const labels = [...new Set(efforts.map((e) => e.label || e.name).filter(Boolean))];
  const label = preferredLabel && labels.includes(preferredLabel) ? preferredLabel : labels[0];
  const filtered = efforts
    .filter((e) => (e.label || e.name) === label && e.time != null && e.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((e) => ({
      date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      time: Number(e.time),
    }));

  let improvement = null;
  if (filtered.length >= 2) {
    const delta = filtered[0].time - filtered[filtered.length - 1].time;
    if (delta > 0) improvement = Math.round(delta);
  }

  return { data: filtered, label, improvement };
}

export function formatPRTime(seconds) {
  if (seconds == null || Number.isNaN(Number(seconds))) return '—';
  const s = Math.round(Number(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, '0')}`;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonday(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date;
}

export function buildWeeklyLogData(activities = [], weeklyPlans = []) {
  const weeks = new Map();

  for (const a of activities) {
    if (!a?.date) continue;
    const monday = getMonday(new Date(a.date));
    const key = monday.toISOString().slice(0, 10);
    if (!weeks.has(key)) {
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      weeks.set(key, {
        weekStart: monday,
        weekLabel: `${monday.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`,
        totalDistance: 0,
        totalTime: 0,
        days: DAY_LABELS.map((day) => ({ day, activities: [] })),
      });
    }
    const week = weeks.get(key);
    const dayIdx = (new Date(a.date).getDay() + 6) % 7;
    week.totalDistance += activityDistanceKm(a);
    week.totalTime += a.durationSeconds || 0;
    week.days[dayIdx].activities.push({
      id: a._id || a.id,
      type: (a.sport || 'cycling').charAt(0).toUpperCase() + (a.sport || 'cycling').slice(1),
      planned: false,
      completed: true,
      distance: activityDistanceKm(a),
      time: fmtDuration(a.durationSeconds),
    });
  }

  for (const plan of weeklyPlans) {
    if (!plan?.startDate || !plan?.workouts) continue;
    const monday = getMonday(new Date(plan.startDate));
    const key = monday.toISOString().slice(0, 10);
    if (!weeks.has(key)) {
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      weeks.set(key, {
        weekStart: monday,
        weekLabel: `${monday.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`,
        totalDistance: 0,
        totalTime: 0,
        days: DAY_LABELS.map((day) => ({ day, activities: [] })),
      });
    }
    const week = weeks.get(key);
    for (const w of plan.workouts) {
      const dayIdx = (w.dayOfWeek + 6) % 7;
      const hasActivity = week.days[dayIdx].activities.some((a) => a.completed);
      if (!hasActivity && w.type && w.type !== 'rest') {
        week.days[dayIdx].activities.push({
          id: `plan-${key}-${dayIdx}`,
          type: (w.type || 'workout').charAt(0).toUpperCase() + (w.type || 'workout').slice(1),
          planned: true,
          completed: !!w.completed,
          distance: w.distance || 0,
          time: w.distance ? fmtDuration(Math.round((w.distance / 28) * 3600)) : '—',
        });
      }
    }
  }

  return Array.from(weeks.values())
    .sort((a, b) => b.weekStart - a.weekStart)
    .slice(0, 8)
    .map((w) => ({
      week: w.weekLabel,
      totalDistance: fmtDist(w.totalDistance),
      totalTime: fmtDuration(w.totalTime),
      days: w.days,
    }));
}

export function getActivityId(activity) {
  return activity?._id || activity?.id || activity?.stravaId;
}

export { fmtDist, fmtDuration, fmtElev, fmtTime };
