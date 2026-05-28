export interface User {
  id: number;
  name: string;
  email: string;
  mainSport: string;
  experienceLevel: string;
}

export interface Activity {
  id: number;
  name: string;
  sport: 'cycling' | 'running';
  distance: number;
  durationSeconds: number;
  elevationGain: number;
  date: string;
}

export interface Race {
  id: number;
  name: string;
  type: string;
  date: string;
  location: string;
  distance: number;
  elevationGain: number;
  priority: string;
}

export interface TrainingPlan {
  id: number;
  name: string;
  content: string;
}

export interface Stats {
  totalDistance: number;
  totalDuration: number;
  totalElevation: number;
  activityCount: number;
}

export interface BestEffort {
  id: string;
  name: string;
  time: number;
  date: string;
  distance: number;
  avgSpeed: number;
  rank: number;
}

export type BestEffortsData = Record<string, BestEffort[]>;

