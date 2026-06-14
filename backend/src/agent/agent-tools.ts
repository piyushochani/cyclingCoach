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
  strava: {
    getAuthUrl(): Promise<string>;
    getSyncStatus(): Promise<Record<string, any>>;
    triggerSync(): Promise<string>;
  };
  gear: {
    listBikes(): Promise<any[]>;
    addBike(name: string, isActive?: boolean): Promise<any>;
    setActiveBike(id: string): Promise<any>;
    listEquipment(): Promise<any[]>;
    addEquipment(name: string, type?: string, notes?: string): Promise<any>;
  };
  faqSearch: (query: string, k?: number) => Promise<{ chunk: { id: string; question: string; content: string; category: string }; score: number }[]>;
}

export function createAgentTools(): ToolDefinition[] {
  return [
    {
      declaration: {
        name: 'memory_read',
        description: 'Read coach-written memory notes (goals, preferences, saved plans). Athlete profile and Strava stats are already in Athlete Context — do not call this for greetings or when profile data is sufficient.',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      execute: async (_args, deps) => {
        const context = await deps.memory.getContext();
        if (context) return { context };
        return { context: 'No coach memory notes stored yet. Use Athlete Context for profile and training stats.' };
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

    {
      declaration: {
        name: 'faq_search',
        description: 'Search the CyclogenAI FAQ for answers about how to use the app, troubleshooting, features, or where to find things in the interface. Use this for any "how do I…" or "where is…" or "what is…" questions about the app itself.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The user\'s question about the app',
            },
          },
          required: ['query'],
        },
      },
      execute: async (args, deps) => {
        const results = await deps.faqSearch(args.query, 5);
        if (!results || results.length === 0) return { message: 'No relevant FAQ found.' };
        return {
          matches: results.map((r) => ({
            question: r.chunk.question,
            answer: r.chunk.content,
            category: r.chunk.category,
          })),
        };
      },
    },

    {
      declaration: {
        name: 'strava_connect',
        description: 'Get the Strava authorization URL so the athlete can connect or reconnect their Strava account. Use this when the athlete asks how to connect Strava, wants to reconnect, or reports sync issues.',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      execute: async (_args, deps) => {
        const url = await deps.strava.getAuthUrl();
        return { authUrl: url, instructions: 'Click the link to authorize CyclogenAI on Strava. You will be redirected back after approval.' };
      },
    },

    {
      declaration: {
        name: 'strava_sync',
        description: 'Trigger a manual Strava sync to pull the latest activities. Use this when the athlete wants to sync their Strava data or their recent rides are not showing up.',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      execute: async (_args, deps) => {
        const result = await deps.strava.triggerSync();
        return { message: result };
      },
    },

    {
      declaration: {
        name: 'strava_status',
        description: 'Check the current Strava sync status — last sync time, whether the data is up to date, and any rate limit issues. Use this when the athlete asks about sync status or whether their data is current.',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      execute: async (_args, deps) => {
        const status = await deps.strava.getSyncStatus();
        return status;
      },
    },

    {
      declaration: {
        name: 'gear_list_bikes',
        description: 'List all bikes registered in the athlete\'s gear library. Use this when the athlete asks "what bikes do I have", "list my bikes", or "show my gear".',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      execute: async (_args, deps) => {
        const bikes = await deps.gear.listBikes();
        if (!bikes || bikes.length === 0) return { message: 'No bikes registered yet. You can add one via the Gear page or ask me to add one for you.' };
        return bikes.map((b: any) => ({
          id: b._id,
          name: b.name,
          distanceKm: ((b.distanceUsed || 0) / 1000).toFixed(1),
          isActive: b.isActive || false,
        }));
      },
    },

    {
      declaration: {
        name: 'gear_add_bike',
        description: 'Add a new bike to the athlete\'s gear library. Use this when the athlete says "add a bike" or "register a new bike".',
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'The name of the bike (e.g. "Trek Emonda SL5", "Canyon Aeroad")',
            },
            setActive: {
              type: 'boolean',
              description: 'Whether to set this bike as the active bike (default: false)',
            },
          },
          required: ['name'],
        },
      },
      execute: async (args, deps) => {
        const bike = await deps.gear.addBike(args.name, args.setActive || false);
        return { saved: true, bike: { id: bike._id, name: bike.name, isActive: bike.isActive } };
      },
    },

    {
      declaration: {
        name: 'gear_set_active_bike',
        description: 'Set a specific bike as the active (default) bike. Use this when the athlete says "set my active bike" or "make [name] my primary bike".',
        parameters: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The ID of the bike to set as active',
            },
          },
          required: ['id'],
        },
      },
      execute: async (args, deps) => {
        await deps.gear.setActiveBike(args.id);
        return { saved: true, activeBikeId: args.id };
      },
    },
  ];
}
