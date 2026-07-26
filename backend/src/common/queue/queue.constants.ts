export const QUEUES = {
  SYNC: 'sync',
  ANALYSIS: 'analysis',
  PLAN: 'plan',
  BEST_EFFORTS: 'best-efforts',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export const DEFAULT_JOB_OPTIONS = {
  removeOnComplete: 100,
  removeOnFail: 50,
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5000 },
};

export function isRedisEnabled(): boolean {
  return process.env.REDIS_ENABLED !== 'false';
}

export function buildJobId(queue: string, userId: string, jobName: string): string {
  return `${queue}:${userId}:${jobName}`;
}

export function resolveRedisConnection(): {
  host: string;
  port: number;
  password?: string;
  username?: string;
  tls?: Record<string, never>;
} {
  const url = process.env.REDIS_URL;
  if (url) {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '6379', 10),
      password: parsed.password || undefined,
      username: parsed.username || undefined,
      tls: parsed.protocol === 'rediss:' ? {} : undefined,
    };
  }
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  };
}
