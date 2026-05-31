export interface ToolDefinition {
  declaration: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
  execute: (args: Record<string, any>, deps: ToolDeps) => Promise<any>;
}

export interface ToolDeps {
  userId: string;
  memory: {
    getContext(): Promise<string>;
    writeSection(section: string, content: string): Promise<void>;
    appendDailyNote(note: string, date?: string): Promise<void>;
    savePlan(plan: Record<string, any>): Promise<void>;
    loadPlan(): Promise<Record<string, any> | null>;
  };
  trainingContext: {
    getCurrentWeekPlan(): Promise<any>;
    getWeeklyPlan(relativeWeek: number): Promise<any>;
    upsertWeeklyPlan(relativeWeek: number, data: any): Promise<any>;
    getPreRacePlans(raceId: string): Promise<any[]>;
  };
  activity: {
    getRecentActivities(limit: number): Promise<any[]>;
  };
}

export function createAgentTools(): ToolDefinition[] {
  return [
    {
      declaration: {
        name: 'memory_read',
        description: 'Read athlete memory including profile, schedule, goals, preferences, notes, medical history, and cycling profile. Use this to recall athlete details.',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      execute: async (_args, deps) => {
        const context = await deps.memory.getContext();
        return { context: context || 'No athlete data stored yet.' };
      },
    },

    {
      declaration: {
        name: 'memory_write',
        description: 'Write to long-term memory sections (person, schedule, goals, preferences, notes, medical-history, cycling-profile) or daily notes. Replaces existing section content.',
        parameters: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['memory', 'daily'],
              description: "'memory' for long-term facts, 'daily' for today's notes",
            },
            section: {
              type: 'string',
              enum: ['person', 'schedule', 'goals', 'preferences', 'notes', 'medical-history', 'cycling-profile', 'cycling-equipment', 'cycling-history'],
              description: 'Memory section to write to (required when type=memory)',
            },
            content: {
              type: 'string',
              description: 'The information to save',
            },
          },
          required: ['type', 'content'],
        },
      },
      execute: async (args, deps) => {
        if (args.type === 'memory') {
          await deps.memory.writeSection(args.section || 'notes', args.content);
        } else {
          await deps.memory.appendDailyNote(args.content);
        }
        return { saved: true };
      },
    },

    {
      declaration: {
        name: 'plan_save',
        description: 'Save or update the current training plan. Use this when you generate or modify a weekly training plan.',
        parameters: {
          type: 'object',
          properties: {
            plan: {
              type: 'object',
              description: 'The training plan object with workouts array and coachNotes',
            },
          },
          required: ['plan'],
        },
      },
      execute: async (args, deps) => {
        await deps.memory.savePlan(args.plan);
        return { saved: true };
      },
    },

    {
      declaration: {
        name: 'plan_load',
        description: 'Load the current active training plan.',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      execute: async (_args, deps) => {
        const plan = await deps.memory.loadPlan();
        return plan || { message: 'No plan saved yet.' };
      },
    },

    {
      declaration: {
        name: 'calculate_zones',
        description: 'Calculate 6 power zones from FTP watts.',
        parameters: {
          type: 'object',
          properties: {
            ftpWatts: {
              type: 'integer',
              description: 'FTP in watts (50-600)',
            },
          },
          required: ['ftpWatts'],
        },
      },
      execute: async (args) => {
        const ftp = args.ftpWatts;
        const zones = [
          { zone: 'Z1', name: 'Active Recovery', minWatts: 0, maxWatts: Math.round(ftp * 0.55) },
          { zone: 'Z2', name: 'Endurance', minWatts: Math.round(ftp * 0.56), maxWatts: Math.round(ftp * 0.75) },
          { zone: 'Z3', name: 'Tempo', minWatts: Math.round(ftp * 0.76), maxWatts: Math.round(ftp * 0.90) },
          { zone: 'Z4', name: 'Sweet Spot', minWatts: Math.round(ftp * 0.88), maxWatts: Math.round(ftp * 0.94) },
          { zone: 'Z5', name: 'Threshold', minWatts: Math.round(ftp * 0.95), maxWatts: Math.round(ftp * 1.05) },
          { zone: 'Z6', name: 'VO2max', minWatts: Math.round(ftp * 1.06), maxWatts: Math.round(ftp * 1.20) },
        ];
        return { ftp, zones };
      },
    },

    {
      declaration: {
        name: 'list_activities',
        description: 'List recent activities from the athlete\'s training log. Use this to review recent training data.',
        parameters: {
          type: 'object',
          properties: {
            limit: {
              type: 'integer',
              description: 'Number of activities to return (max 50)',
              default: 10,
            },
          },
          required: [],
        },
      },
      execute: async (args, deps) => {
        const limit = Math.min(args.limit || 10, 50);
        const activities = await deps.activity.getRecentActivities(limit);
        return activities.map((a: any) => ({
          name: a.name,
          date: a.date,
          sport: a.sport,
          distanceKm: a.distance ? (a.distance / 1000).toFixed(2) : 0,
          durationHours: a.durationSeconds ? (a.durationSeconds / 3600).toFixed(2) : 0,
          elevationGain: a.elevationGain || 0,
          avgWatts: a.averageWatts || null,
          avgHeartrate: a.averageHeartrate || null,
          trainer: a.trainer || false,
        }));
      },
    },

    {
      declaration: {
        name: 'get_weekly_plan',
        description: 'Get the current weekly training plan from the database. Shows workouts scheduled for this week.',
        parameters: {
          type: 'object',
          properties: {
            relativeWeek: {
              type: 'integer',
              description: 'Optional relative week number. If not provided, returns the current week plan.',
            },
          },
          required: [],
        },
      },
      execute: async (args, deps) => {
        if (args.relativeWeek != null) {
          return deps.trainingContext.getWeeklyPlan(args.relativeWeek);
        }
        return deps.trainingContext.getCurrentWeekPlan();
      },
    },

    {
      declaration: {
        name: 'get_pre_race_plans',
        description: 'Get pre-race week plans for a specific race.',
        parameters: {
          type: 'object',
          properties: {
            raceId: {
              type: 'string',
              description: 'The race ID to get plans for',
            },
          },
          required: ['raceId'],
        },
      },
      execute: async (args, deps) => {
        return deps.trainingContext.getPreRacePlans(args.raceId);
      },
    },
  ];
}
