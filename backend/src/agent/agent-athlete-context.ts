import { Model } from 'mongoose';
import { User } from '../user/user.schema';
import { Activity } from '../activity/activity.schema';
import { Race } from '../race/race.schema';
import { ChatIntent } from './agent-intent';

export async function buildAthleteProfile(
  userModel: Model<User>,
  userId: string,
): Promise<{ profile: string; firstName: string }> {
  const user = await userModel.findById(userId as any).lean().exec();
  if (!user) return { profile: '', firstName: '' };

  const parts: string[] = [];
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
  if (name) parts.push(`Name: ${name}`);
  parts.push(`Sport: ${(user as any).mainSport || 'cycling'}`);
  if (user.goal) parts.push(`Goal: ${user.goal}`);
  if (user.ftp) parts.push(`FTP: ${user.ftp} W`);
  if (user.weightKg) parts.push(`Weight: ${user.weightKg} kg`);
  if (user.heightCm) parts.push(`Height: ${user.heightCm} cm`);
  if (user.maxHeartrate) parts.push(`Max HR: ${user.maxHeartrate} bpm`);
  if (user.age) parts.push(`Age: ${user.age}`);
  if (user.cyclingYears) parts.push(`Cycling experience: ${user.cyclingYears} years`);
  if (user.experienceLevel) parts.push(`Level: ${user.experienceLevel}`);
  if ((user as any).weeklyGoalKm) parts.push(`Weekly goal: ${(user as any).weeklyGoalKm} km`);
  if ((user as any).trainingStart) {
    const start = new Date((user as any).trainingStart);
    const weeks = Math.floor((Date.now() - start.getTime()) / (7 * 86400000)) + 1;
    parts.push(`Training week: ${weeks} (started ${start.toISOString().split('T')[0]})`);
  }
  if ((user as any).selectedCoach?.name) parts.push(`Coach: ${(user as any).selectedCoach.name}`);
  if ((user as any).subscriptionTier) parts.push(`Plan: ${(user as any).subscriptionTier}`);
  if (user.onboardingSummary) parts.push(`Background: ${user.onboardingSummary}`);
  if (user.description) parts.push(`Notes: ${user.description}`);

  const distKm = ((user.totalDistance || 0) / 1000).toFixed(0);
  const hours = Math.round((user.totalMovingTime || 0) / 3600);
  parts.push(`Total distance: ${distKm} km`);
  parts.push(`Total moving time: ${hours} hours`);

  const stravaConnected = !!(user as any).stravaAccessToken;
  parts.push(`Strava: ${stravaConnected ? 'connected' : 'not connected'}`);
  if (stravaConnected && (user as any).isStravaUpToDate !== undefined) {
    parts.push(`Strava up-to-date: ${(user as any).isStravaUpToDate}`);
  }
  if (user.lastSyncAt) {
    parts.push(`Last sync: ${new Date(user.lastSyncAt).toISOString().split('T')[0]}`);
  }

  return { profile: parts.join('\n'), firstName: user.firstName || '' };
}

export async function buildActivitySummary(
  activityModel: Model<Activity>,
  userId: string,
  limit = 5,
): Promise<string> {
  const activities = await activityModel
    .find({ 
      user: userId as any,
      sport: { $regex: /ride|cycling|bike|bicycle|velomobile|handcycle/i }
    })
    .sort({ date: -1 })
    .limit(limit)
    .lean()
    .exec();

  if (!activities.length) return '';

  const lines = activities.map((a: any) => {
    const date = a.date ? new Date(a.date).toISOString().split('T')[0] : 'unknown';
    const km = a.distance ? (a.distance / 1000).toFixed(1) : '?';
    const hrs = a.durationSeconds ? (a.durationSeconds / 3600).toFixed(1) : '?';
    const watts = a.averageWatts ? `, ${a.averageWatts}W avg` : '';
    return `- ${date}: ${a.name || 'Ride'} — ${km} km, ${hrs}h${watts}`;
  });

  return `Recent activities (last ${activities.length}):\n${lines.join('\n')}`;
}

export function mergeAthleteContext(
  profile: string,
  agentMemory: string,
  extraBlocks: string[],
): string {
  const parts: string[] = [];
  if (profile) parts.push(profile);
  for (const block of extraBlocks) {
    if (block) parts.push(block);
  }
  if (agentMemory) parts.push(`Coach notes (memory):\n${agentMemory}`);
  return parts.join('\n\n');
}

export async function buildMonthSummary(
  activityModel: Model<Activity>,
  userId: string,
): Promise<string> {
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const activities = await activityModel
    .find({
      user: userId as any,
      sport: { $regex: /ride|cycling|bike|bicycle|velomobile|handcycle/i },
      date: { $gte: fourWeeksAgo },
    })
    .sort({ date: 1 })
    .lean()
    .exec();

  if (!activities.length) return 'No cycling activities found in the last 4 weeks.';

  const weeks: { label: string; rides: any[] }[] = [];
  let currentWeek: any[] = [];
  let currentStart = new Date(activities[0].date);
  currentStart.setDate(currentStart.getDate() - currentStart.getDay() + 1);

  for (const a of activities) {
    const d = new Date(a.date);
    const weekStart = new Date(d);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    if (weekStart.getTime() !== currentStart.getTime()) {
      if (currentWeek.length) {
        weeks.push({ label: formatWeekLabel(currentStart, currentWeek), rides: [...currentWeek] });
      }
      currentWeek = [];
      currentStart = weekStart;
    }
    currentWeek.push(a);
  }
  if (currentWeek.length) {
    weeks.push({ label: formatWeekLabel(currentStart, currentWeek), rides: currentWeek });
  }

  const lines = weeks.map((w) => {
    const totalKm = w.rides.reduce((s, r) => s + ((r.distance || 0) / 1000), 0);
    const totalHrs = w.rides.reduce((s, r) => s + ((r.durationSeconds || 0) / 3600), 0);
    const rides = w.rides.map((r) => {
      const km = (r.distance / 1000).toFixed(1);
      const hrs = (r.durationSeconds / 3600).toFixed(1);
      return `${r.name || 'Ride'} — ${km} km, ${hrs}h${r.averageWatts ? `, ${r.averageWatts}W` : ''}`;
    });
    return `${w.label}: ${w.rides.length} ride(s), ${totalKm.toFixed(0)} km total, ${totalHrs.toFixed(1)} hours\n${rides.map(r => `  - ${r}`).join('\n')}`;
  });

  return `# Month Analysis (last 4 weeks)\n\nHere is the week-by-week breakdown:\n\n${lines.join('\n\n')}\n\nSummarize the athlete's month in a natural coaching tone. For each week, mention the volume, intensity, and any notable patterns or improvements. End with a recommendation for the coming week.`;
}

function formatWeekLabel(weekStart: Date, rides: any[]): string {
  const start = weekStart.toISOString().split('T')[0];
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const endStr = end.toISOString().split('T')[0];
  return `Week of ${start} – ${endStr}`;
}

export async function buildRaceContext(
  raceModel: Model<Race>,
  userId: string,
  limit = 10,
): Promise<string> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const races = await raceModel
    .find({ user: userId as any, date: { $gte: today } })
    .sort({ date: 1 })
    .limit(limit)
    .lean()
    .exec();

  if (!races.length) return '';

  const now = new Date();
  const lines = races.map((r: any) => {
    const date = r.date ? new Date(r.date).toISOString().split('T')[0] : '?';
    const daysUntil = Math.round((new Date(r.date).getTime() - now.getTime()) / 86400000);
    const when = daysUntil <= 0 ? 'today/tomorrow' : `in ${daysUntil} days`;

    const parts = [`- ${r.name} (${when})`, `  Date: ${date} | Type: ${r.type || '?'} | Terrain: ${r.terrain || '?'}`];
    parts.push(`  Location: ${r.location || '?'} | Distance: ${r.distance ? `${r.distance} km` : '?'} | Elevation: ${r.elevationGain ? `${r.elevationGain} m` : '?'} | Priority: ${r.priority || '?'}`);
    if (r.story) parts.push(`  Rider's goal/expectations: ${r.story}`);
    if (r.description) parts.push(`  Course description: ${r.description}`);
    return parts.join('\n');
  });

  return `## Upcoming Races\n\nThe following races are on the athlete's calendar:\n\n${lines.join('\n\n')}`;
}

export function contextBlocksForIntent(intent: ChatIntent): {
  loadActivities: boolean;
  loadPlan: boolean;
} {
  return {
    loadActivities: intent === 'activities' || intent === 'general' || intent === 'month',
    loadPlan: intent === 'plan' || intent === 'general',
  };
}
