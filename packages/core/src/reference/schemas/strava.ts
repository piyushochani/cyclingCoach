import { z } from "zod";

/**
 * Static athlete profile metrics.
 */
export const AthleteProfileSchema = z.object({
  ftp: z.number().nonnegative().optional(),
  weight: z.number().nonnegative().optional(),
  height: z.number().nonnegative().optional(),
  maxHeartRate: z.number().nonnegative().optional(),
  restingHeartRate: z.number().nonnegative().optional(),
  yearsInCycling: z.number().nonnegative().optional(),
  preferredDisciplines: z.array(z.string()).optional(),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
});
export type AthleteProfile = z.infer<typeof AthleteProfileSchema>;

/**
 * Single activity chunk for vector storage.
 */
export const ActivityChunkSchema = z.object({
  id: z.number(),
  name: z.string(),
  sportType: z.string(),
  startDateLocal: z.string(),
  elapsedTime: z.number(),
  movingTime: z.number(),
  distance: z.number(),
  averagePower: z.number().optional(),
  maxPower: z.number().optional(),
  weightedAveragePower: z.number().optional(),
  averageHeartRate: z.number().optional(),
  maxHeartRate: z.number().optional(),
  totalElevationGain: z.number().optional(),
  averageCadence: z.number().optional(),
  averageSpeed: z.number().optional(),
  kilojoules: z.number().optional(),
  description: z.string().optional(),
  labels: z.array(z.string()).optional(),
  summary: z.string(), // Natural language summary for embedding
});
export type ActivityChunk = z.infer<typeof ActivityChunkSchema>;
