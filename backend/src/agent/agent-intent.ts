export type ChatIntent = 'greeting' | 'activities' | 'plan' | 'zones' | 'strava' | 'gear' | 'faq' | 'general' | 'month';

const GREETING_RE =
  /^(hi|hello|hey|howdy|hiya|yo|sup|what'?s\s*up|good\s+(morning|afternoon|evening|day))[\s!.?,]*$/i;

const ACTIVITIES_RE =
  /\b(recent|last|latest|past)\s+(ride|rides|activity|activities|workout|workouts|session|sessions|training)\b|\bmy (rides|activities|workouts)\b|\bhow (was|did|is) my (ride|last|training|week)\b|\blist activities\b/i;

const PLAN_RE =
  /\b(training plan|weekly plan|this week|schedule|planned workout|what('s| is) (on|planned)|workout plan|race plan|generate.*plan|plan.*week|create.*workout|build.*plan)\b/i;

const ZONES_RE = /\b(zones?|ftp|power zone|heart rate zone|threshold)\b/i;

const STRAVA_RE =
  /\b(strava|sync|connect.*strava|disconnect.*strava|strava.*status|auth.*strava|strava.*auth|strava.*connect|sync.*status|sync now)\b/i;

const GEAR_RE =
  /\b(gear|bike|bikes|equipment|add.*bike|list.*bike|set.*active.*bike|my.*bike|new.*bike|register.*bike)\b/i;

const MONTH_RE =
  /^\/month|\bmonthly (analysis|review|report)|analyse my month|analyze my month\b/i;

const FAQ_RE =
  /\b(how (do|can|to)|where (is|are|can|do)|what is|how to|troubleshoot|help|guide|faq|not working|error|problem|issue|can't|doesn't|couldn't)\b/i;

export function classifyIntent(message: string): ChatIntent {
  const trimmed = message.trim();
  if (!trimmed) return 'general';

  // Check message length — single word or very short might be miscategorized
  const words = trimmed.split(/\s+/);

  if (GREETING_RE.test(trimmed)) return 'greeting';
  if (ACTIVITIES_RE.test(trimmed)) return 'activities';
  if (PLAN_RE.test(trimmed)) return 'plan';
  if (ZONES_RE.test(trimmed)) return 'zones';
  if (MONTH_RE.test(trimmed)) return 'month';
  if (STRAVA_RE.test(trimmed)) return 'strava';
  if (GEAR_RE.test(trimmed)) return 'gear';
  if (FAQ_RE.test(trimmed)) return 'faq';
  return 'general';
}

export function shouldUseRag(intent: ChatIntent): boolean {
  return intent === 'activities';
}

export function shouldLoadAgentMemory(intent: ChatIntent): boolean {
  return intent === 'plan';
}

export function shouldSearchFaq(intent: ChatIntent): boolean {
  return intent === 'faq' || intent === 'general';
}

const TOOL_NAMES_BY_INTENT: Record<ChatIntent, string[]> = {
  greeting: [],
  activities: ['list_activities'],
  plan: ['get_weekly_plan', 'plan_load'],
  zones: ['calculate_zones'],
  month: [],
  strava: ['strava_connect', 'strava_sync', 'strava_status'],
  gear: ['gear_list_bikes', 'gear_add_bike', 'gear_set_active_bike'],
  faq: ['faq_search'],
  general: [],
};

export function toolNamesForIntent(intent: ChatIntent): string[] {
  return TOOL_NAMES_BY_INTENT[intent];
}

export function buildGreetingReply(firstName: string): string {
  const name = firstName?.trim() || 'there';
  return `Hey ${name}! What would you like to work on today — your training, recovery, or this week's plan?`;
}
