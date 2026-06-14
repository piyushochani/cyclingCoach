import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync, readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { ContextBuilderService } from './context-builder.service';
import { DataProcessorService, computeHRZoneBoundaries } from './data-processor.service';
import { User } from '../user/user.schema';
import { logKeyHealth } from '../common/gemini-key-validator';
import { callGroqSimple } from '../common/groq-client';
import { isGeminiQuotaError } from '../common/llm-config';

const DAILY_PROMPT = `# Daily Review

You are reviewing a single day of training for a cyclist. The athlete did one or more activities on this day.

## Scope
- Analyze only the activities from the requested date
- If multiple activities exist on the same day, treat them as a single training session (cluster within 30 min gap)
- Focus on the quality, intent, and execution of the day's work

## What to cover
1. **Session summary** — what the athlete did, total volume (distance, time, elevation)
2. **Quality assessment** — did the session hit its likely intent? (endurance, intervals, recovery, race)
3. **Key metrics** — distance, duration, avg speed, pace, elevation, cadence rate if available, gradient, terrain classification, power/HR data if available, session type classification
4. **Weather & terrain context** — note indoor/outdoor, terrain profile, any weather data
5. **One actionable insight** — what to carry forward or adjust tomorrow, for this check the week schedule as well

## Output style
- 3–5 concise bullet points or a short paragraph
- Focus on actionable takeaways, not raw numbers
- Don't highlight the distance, time and calories as the user is already aware of that, just mention it.
- Use cycling terminology naturally (FTP, Z2, sweet spot, threshold, VO2, endurance, recovery, intervals, sprint session)
- If the data includes power/HR metrics, cadence rate, elevation reference zones and decoupling

## Edge cases
- **Rest day** (no activities): acknowledge the rest and its role in the training cycle
- **Single short ride** (< 30 min): evaluate as active recovery or commuter context
- **Multiple activities**: cluster and review as one session; note the cumulative load`;

const WEEKLY_PROMPT = `# Weekly Review

You are reviewing a full week of training for a cyclist. Look at the week holistically — volume, consistency, intensity distribution, and recovery.

## Scope
- Analyze all activities from Monday–Sunday of the requested week
- Evaluate the week as a training block, not isolated sessions
- Compare against typical weekly patterns (endurance base, build, taper, race week)

## What to cover
1. **Weekly totals** — distance, time, elevation, activity count, days ridden
2. **Consistency** — how many active days, any back-to-back hard days, rest day placement
3. **Intensity distribution** — what fraction was endurance/recovery, tempo, sweet spot, threshold/VO2, race
4. **Terrain & weather patterns** — indoor vs outdoor split, terrain types encountered
5. **Load trend** — how this week compares to the previous 2–3 weeks (rising, holding, declining)
6. **Recovery signal** — are there signs of fatigue (declining performance, skipped sessions, higher HR at same power)?
7. **One recommendation** — what to adjust for next week
8. **What was intended in this week and why is it helpful for you.

## Output style
- Short paragraph summary (2–3 sentences) followed by 4–6 bullet points
- The exact format is:
  (Title of the ride)
  Date
  Distance
  Average speed
  Calories
  Ride type(endurance, intervals, recovery, race, mixed, VO2 max, FTP test, etc)
  Zone Split if HR data is there(Eg: 30 mins Z2 + 10mins Z4 + 5mins Z2 + 10mins Z4 + 30 mins Z2 recovery)
  Summary
- Lead with the big picture — was this a productive, maintenance, or recovery week?
- Reference the previous week for context when available
- Use cycling terminology naturally

## Edge cases
- **Incomplete week** (today is mid-week): evaluate what's available and note it's partial
- **Zero-activity week**: assess as planned recovery, missed week, or off-season — ask if intentional
- **Race week**: evaluate taper/peak execution alongside the race effort itself
- **Extreme volume spike** (>50% above trailing 4-week avg): flag overreach risk`;

const MONTHLY_PROMPT = `# Monthly Review

You are reviewing a full month of training for a cyclist. Evaluate trends, progress toward goals, training load patterns, and overall fitness trajectory.

## Scope
- Analyze all activities from the requested month
- Compare against the previous month when available
- Evaluate the month as a macro-cycle phase (base, build, peak, taper, transition)

## What to cover
1. **Monthly totals** — distance, time, elevation, activity count, days ridden
2. **Volume trend** — how total distance and time compare to the previous month (+, -, or flat)
3. **Frequency & consistency** — active days, longest streak, rest day cadence
4. **Intensity breakdown** — session type distribution across the month
5. **Terrain diversity** — flat vs rolling vs hilly vs climbing ride distribution
6. **Progression signal** — are distances getting longer, speeds improving, elevation tolerance increasing?
7. **Fatigue check** — any red flags (declining frequency, shorter rides, erratic pacing, long gaps)
8. **Goal alignment** — does this month's work align with the athlete's stated goals (e.g., gran fondo, racing, weight loss)?
9. **Next month recommendation** — what to continue, start, or stop

## Output style
- Executive summary (2–3 sentences) followed by 5–8 bullet points
- Include a "Month vs Previous Month" comparison table when previous data exists
- Lead with the trajectory — improving, maintaining, or declining
- Reference any long-term goals and how the month fits the bigger picture

## Edge cases
- **First month of data**: note there's no baseline yet; focus on establishing routine
- **Very low volume month** (< 4 rides): assess context (injury, weather, travel, illness)
- **Race month**: evaluate peak execution and recovery from the event
- **Transition month**: acknowledge seasonal shifts (outdoor ↔ indoor)`;

const CHAT_SYSTEM_PROMPT = `# Cycling Coach

You are a structured, data-driven cycling coach. You have access to the athlete's activity data.

## Principles
- Consistency beats heroic efforts — 4 solid weeks > 1 incredible week + 3 weeks off
- Recovery is training — never skip recovery weeks
- Adapt to the athlete, not the other way around
- Be honest about goal feasibility — ambitious is good, unrealistic causes injury

## Behavior
- Use power zones (% FTP), never arbitrary watt numbers
- Explain the "why" behind every workout
- Flag overtraining signals: declining form, rising fatigue, missed sessions
- When the athlete shares personal details (FTP, weight, schedule, goals, preferences, injuries), acknowledge them

## Response Length
Match response length to question complexity:
- **Quick question** (zone lookup, yes/no, single fact) → 1-3 sentences
- **Explanation** (how sweet spot works, recovery advice, race tactics) → short paragraph + bullets
- **Workout prescription** → structured interval list, one step per line
- **Training plan** → phased list, one workout per line within each phase

## Communication
- Use bullet points and short vertical lists, not paragraphs or wide tables
- Use cycling terminology (FTP, load, intensity, fitness, fatigue, form, sweet spot, threshold)
- Format workouts as structured intervals (warmup → main → cooldown)
- Answer the athlete's question first, then add caveats briefly if required`;

const PROMPTS = {
  daily: DAILY_PROMPT,
  weekly: WEEKLY_PROMPT,
  monthly: MONTHLY_PROMPT,
  chat: CHAT_SYSTEM_PROMPT,
};

interface ActivityData {
  name?: string;
  date?: string;
  sport?: string;
  distance?: number;
  durationSeconds?: number;
  elevationGain?: number;
  calories?: number;
  averageWatts?: number;
  maxWatts?: number;
  weightedAverageWatts?: number;
  kilojoules?: number;
  averageHeartrate?: number;
  maxHeartrate?: number;
  trainer?: boolean;
}

interface AnalysisRequest {
  type: keyof typeof PROMPTS;
  activities: ActivityData[];
  message?: string;
  previousActivities?: ActivityData[];
}

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    private readonly contextBuilder: ContextBuilderService,
    private readonly dataProcessor: DataProcessorService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {
    logKeyHealth(this.logger, 'sync').catch(() => {});
  }

  private async resolveUser(userId?: string): Promise<any> {
    if (!userId) return {};
    try {
      return await this.userModel.findById(userId).lean().exec() || {};
    } catch {
      return {};
    }
  }

  async analyze(req: AnalysisRequest, userId?: string): Promise<{ analysis: string }> {
    const persona = PROMPTS[req.type] || PROMPTS.chat;

    if (!req.activities || req.activities.length === 0) {
      const result = await this.callLLM(`${persona}\n\nThe athlete has no activities recorded for this period.\n\n${req.message || 'Please review my training.'}`);
      return { analysis: result };
    }

    const user = await this.resolveUser(userId);
    const context = await this.contextBuilder.buildContext(
      user,
      req.activities,
      req.previousActivities,
    );

    const userMessage = req.message || 'Please review my training.';

    const activitiesFormatted = context.activities.map((a, i) => {
      const gradientMPerKm = a.distanceKm > 0 ? a.elevationGain / a.distanceKm : 0;
      const lines = [
        `Activity ${i + 1}: ${a.name || 'Unnamed'} (${a.date || 'unknown date'})`,
        `  Type: ${a.sport || 'Ride'} | ${a.trainer ? 'Indoor' : 'Outdoor'}`,
        `  Distance: ${a.distanceKm.toFixed(2)} km`,
        `  Duration: ${(a.movingTimeMin / 60).toFixed(2)} hours`,
        `  Avg Speed: ${a.avgSpeedKph.toFixed(2)} km/h`,
        `  Elevation: ${a.elevationGain.toFixed(2)} m`,
        `  Gradient: ${gradientMPerKm.toFixed(2)} m/km`,
        `  Terrain: ${a.terrainClass}`,
        `  Session Type: ${a.sessionType}`,
      ];

      if (a.avgWatts != null) lines.push(`  Avg Power: ${a.avgWatts.toFixed(2)} W` + (a.maxWatts != null ? ` (Max: ${a.maxWatts.toFixed(2)} W)` : ''));
      if (a.normalizedPower != null) lines.push(`  Normalized Power (NP): ${a.normalizedPower.toFixed(2)} W`);
      if (a.kilojoules != null) lines.push(`  Energy: ${a.kilojoules.toFixed(2)} kJ`);
      if (a.avgHeartrate != null) lines.push(`  Avg HR: ${a.avgHeartrate.toFixed(2)} bpm` + (a.maxHeartrate != null ? ` (Max: ${a.maxHeartrate.toFixed(2)} bpm)` : ''));

      return lines.join('\n');
    }).join('\n\n');

    const previousFormatted = req.previousActivities?.length
      ? `\n\n## Previous Period Activities\n${req.previousActivities.map((a, i) => {
          const p = this.dataProcessor.process(a);
          return `  Prev ${i + 1}: ${p.distanceKm.toFixed(2)} km, ${p.elevationGain.toFixed(2)} m elev, ${p.avgSpeedKph.toFixed(2)} km/h avg`;
        }).join('\n')}`
      : '\n\n## Previous Period Activities\nNone available.';

    const effectiveMaxHr = context.athlete.maxHeartrate || (context.athlete.age ? Math.round(220 - context.athlete.age) : null);
    const hrZones = effectiveMaxHr ? computeHRZoneBoundaries(effectiveMaxHr) : null;
    const hrZoneLines = hrZones
      ? hrZones.map((z) => `  ${z.zone} (${z.label}): ${z.minBpm}-${z.maxBpm} bpm (${z.minPercent}-${z.maxPercent}% max HR)`).join('\n')
      : null;

    const athleteSection = context.athlete.ftp || effectiveMaxHr || context.athlete.onboardingSummary
      ? `## Athlete Profile\n${context.athlete.ftp ? `  FTP: ${context.athlete.ftp} W\n` : ''}${context.athlete.weightKg ? `  Weight: ${context.athlete.weightKg} kg\n` : ''}${effectiveMaxHr ? `  Max HR: ${effectiveMaxHr} bpm\n${hrZoneLines ? `  HR Zones:\n${hrZoneLines}` : ''}` : ''}${context.athlete.onboardingSummary ? `  Athlete Background:\n  ${context.athlete.onboardingSummary}\n` : ''}  Experience: ${context.athlete.experienceLevel}\n  Goal: ${context.athlete.goal || 'Not specified'}`
      : '';

    const prompt = `${persona}

---

# Athlete Data

${athleteSection ? athleteSection + '\n' : ''}
## Period Summary
  ${context.summary}

## Training Phase
  ${context.trainingPhaseNote}

## Weather Context
  ${context.weatherNote}

${context.historicalContext ? context.historicalContext + '\n' : ''}
## Activities for review
\`\`\`
${activitiesFormatted}
\`\`\`
${previousFormatted}
---

${userMessage}`;

    const result = await this.callLLM(prompt);
    return { analysis: result };
  }

  async generateNextWeekPlan(activities: any[], userId?: string): Promise<{ workouts: any[]; coachNotes: string }> {
    if (!activities || activities.length === 0) {
      return { workouts: [], coachNotes: 'No recent activities to base the plan on.' };
    }

    const user = await this.resolveUser(userId);
    const context = await this.contextBuilder.buildContext(user, activities, []);

    const effectiveMaxHr = context.athlete.maxHeartrate || (context.athlete.age ? Math.round(220 - context.athlete.age) : null);
    const hrZones = effectiveMaxHr ? computeHRZoneBoundaries(effectiveMaxHr) : null;
    const hrZoneLines = hrZones
      ? hrZones.map((z) => `  ${z.zone} (${z.label}): ${z.minBpm}-${z.maxBpm} bpm`).join('\n')
      : null;

    const activitiesFormatted = context.activities
      .map((a, i) => {
        const lines = [
          `${a.name || 'Unnamed'} | ${a.date || '?'}`,
          `  ${a.distanceKm.toFixed(1)} km, ${a.movingTimeMin.toFixed(0)} min, ${a.elevationGain.toFixed(0)} m elev`,
          `  ${a.sessionType} | ${a.terrainClass}`,
        ];
        if (a.avgWatts != null) lines.push(`  ${a.avgWatts} W avg`);
        if (a.avgHeartrate != null) lines.push(`  ${a.avgHeartrate} bpm avg`);
        return lines.join('\n');
      })
      .join('\n\n');

    const prompt = `You are a cycling coach generating a next-week training plan as JSON.

## Athlete Context
${context.athlete.ftp ? `FTP: ${context.athlete.ftp} W` : ''}
${context.athlete.weightKg ? `Weight: ${context.athlete.weightKg} kg` : ''}
${effectiveMaxHr ? `Max HR: ${effectiveMaxHr} bpm\nHR Zones:\n${hrZoneLines}` : ''}
${context.athlete.onboardingSummary ? `Athlete Background: ${context.athlete.onboardingSummary}` : ''}
Goal: ${context.athlete.goal || 'Not specified'}

## Recent Activity Summary
${context.summary}

## Recent Activities
${activitiesFormatted}

## Instructions
Generate a 7-day training plan for the NEXT week. Respond with ONLY valid JSON matching this schema:
{
  "workouts": [
    {
      "dayOfWeek": 0,
      "type": "rest|recovery|endurance|tempo|threshold|intervals|vo2max|race|long",
      "distance": <number in km>,
      "zoneBreakdown": "<zone description>",
      "terrain": "<flat|rolling|hilly|mixed>",
      "notes": "<brief workout description>"
    }
  ],
  "coachNotes": "<2-3 sentence plan overview>"
}

- dayOfWeek: 0=Monday through 6=Sunday
- IMPORTANT: Monday (dayOfWeek=0) MUST always be a rest day
- IMPORTANT: Sunday (dayOfWeek=6) MUST always be the long ride day
- Include appropriate intensity distribution throughout the week
- Distance in kilometers (not meters)
- Match the athlete's recent training volume and goals
- Output ONLY the JSON object, no markdown or commentary`;

    const raw = await this.callLLM(prompt, { temperature: 0.2, keyType: 'plan' });

    if (raw.startsWith('Sorry,') || raw.startsWith('AI analysis is not configured') || raw.startsWith('No analysis')) {
      return { workouts: [], coachNotes: raw };
    }

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in LLM response');
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        workouts: parsed.workouts || [],
        coachNotes: parsed.coachNotes || 'Plan generated for next week.',
      };
    } catch {
      return {
        workouts: [],
        coachNotes: 'Could not generate a plan. Please try again.',
      };
    }
  }

  private async callLLM(prompt: string, opts?: { temperature?: number; maxTokens?: number; keyType?: string }): Promise<string> {
    let apiKeys: string[] = [];
    let model = process.env.GOOGLE_LLM_MODEL || 'gemini-2.0-flash-lite';

    // 1. Try dedicated key pool first based on keyType
    let rawKeys = '';
    if (opts?.keyType === 'plan') {
      rawKeys = process.env.GOOGLE_GENERATIVE_AI_PLAN_API_KEYS || '';
    }
    // 2. Fall back to sync keys
    if (!rawKeys) {
      rawKeys = process.env.GOOGLE_GENERATIVE_AI_SYNC_API_KEYS || '';
    }
    // 3. Fall back to main key
    if (!rawKeys) {
      rawKeys = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';
    }
    if (rawKeys) {
      apiKeys = rawKeys.split(',').map((k) => k.trim()).filter(Boolean);
    }

    // 4. Fallback to config.yaml if env keys are missing
    if (apiKeys.length === 0) {
      const configPaths = [
        join(homedir(), '.cycling-coach', 'config.yaml'),
        join(homedir(), '.config', 'cycling-coach', 'config.yaml'),
        join(homedir(), '.enduragent', 'cycling-coach', 'config.yaml'),
      ];
      for (const p of configPaths) {
        if (existsSync(p)) {
          try {
            const raw = readFileSync(p, 'utf-8');
            const c = parseYaml(raw) as any;
            if (c?.llm?.sync_api_key) {
              apiKeys = String(c.llm.sync_api_key).split(',').map((k: string) => k.trim()).filter(Boolean);
              if (c.llm.model) model = c.llm.model;
              break;
            }
            if (c?.llm?.api_key) {
              apiKeys = String(c.llm.api_key).split(',').map((k: string) => k.trim()).filter(Boolean);
              if (c.llm.model) model = c.llm.model;
              break;
            }
          } catch {}
        }
      }
    }

    if (apiKeys.length === 0) {
      return 'AI analysis is not configured. Please set GOOGLE_GENERATIVE_AI_SYNC_API_KEYS in your environment.';
    }

    const temperature = opts?.temperature ?? 0.7;
    const maxTokens = opts?.maxTokens ?? 2048;

    const maxAttempts = apiKeys.length * 2;
    const fallbackModel = 'gemini-2.0-flash-lite';
    let usedFallback = false;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const key = apiKeys[attempt % apiKeys.length];
      const currentModel = usedFallback ? fallbackModel : model;
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                temperature,
                maxOutputTokens: maxTokens,
              },
            }),
          },
        );

        if (response.status === 429) {
          const errBody = await response.text().catch(() => '');
          this.logger.warn(`LLM rate limited — quota likely exhausted for key`);
          if (isGeminiQuotaError(response.status, errBody)) {
            this.logger.warn('Gemini quota exhausted — falling back to Groq');
            const groqAnswer = await callGroqSimple(this.logger, prompt, { temperature, maxTokens });
            if (groqAnswer) return groqAnswer;
            return 'Sorry, the AI analysis service is currently unavailable due to API quota limits. Please try again later or add more API keys.';
          }
          if (!usedFallback) {
            usedFallback = true;
            this.logger.warn(`Falling back to ${fallbackModel} with different key`);
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }
          const groqAnswer = await callGroqSimple(this.logger, prompt, { temperature, maxTokens });
          if (groqAnswer) return groqAnswer;
          return 'Sorry, the AI analysis service is currently unavailable due to API quota limits. Please try again later or add more API keys.';
        }

        if (response.status === 503) {
          this.logger.warn(`LLM temporarily unavailable (attempt ${attempt + 1}), retrying...`);
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }

        if (!response.ok) {
          const errText = await response.text();
          this.logger.error(`Gemini API error: ${response.status} ${errText}`);
          return 'Sorry, the AI analysis service encountered an error. Please try again later.';
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return text || 'No analysis could be generated.';
      } catch (err) {
        this.logger.error(`LLM call failed (attempt ${attempt + 1}): ${err}`);
        if (attempt === maxAttempts - 1) {
          return 'Sorry, the AI analysis service is currently unavailable.';
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    return 'Sorry, the AI analysis service is currently unavailable.';
  }
}
