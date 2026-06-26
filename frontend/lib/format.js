export function fmtDist(km) {
  if (km == null || isNaN(km)) return '—';
  return Number(km).toFixed(2);
}

export function fmtElev(m) {
  if (m == null || isNaN(m)) return '—';
  return Number(m).toFixed(1);
}

export function fmtPower(watts) {
  if (watts == null || isNaN(watts)) return '—';
  return Number(watts).toFixed(1);
}

export function fmtSpeed(ms) {
  if (ms == null || isNaN(ms)) return '—';
  return `${(Number(ms) * 3.6).toFixed(1)} km/h`;
}

export function fmtTime(seconds) {
  if (seconds == null || isNaN(seconds)) return '—';
  const s = Math.round(Number(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}`;
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export function fmtDuration(seconds) {
  if (seconds == null || isNaN(seconds)) return '—';
  const s = Math.round(Number(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function fmtNum(n) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-US', { useGrouping: false });
}

export function fmtPct(p) {
  if (p == null || isNaN(p)) return '—';
  return `${Number(p).toFixed(1)}%`;
}
