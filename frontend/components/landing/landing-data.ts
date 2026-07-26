export const NAV_ITEMS = [
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How It Works" },
  { id: "pricing", label: "Pricing" },
  { id: "about", label: "About" },
  { id: "reviews", label: "Reviews" },
] as const;

export const STATS = [
  { value: "685+", label: "Activities logged" },
  { value: "53K+", label: "KM analyzed" },
  { value: "100+", label: "Active Users" },
  { value: "4.9", label: "Avg. rating" },
] as const;

export const FEATURES = [
  {
    tag: "Adaptive planning",
    title: "Weekly plans that evolve with you",
    body: "AI rebuilds your training block around fitness, fatigue, and your race calendar — no spreadsheet juggling.",
    icon: "calendar",
  },
  {
    tag: "Race intelligence",
    title: "Peak form, on schedule",
    body: "Set a target event and get taper timing, pacing targets, and final-week sharpening built into your plan.",
    icon: "target",
  },
  {
    tag: "Deep analytics",
    title: "Every ride, interpreted",
    body: "Power, HR, terrain, and recovery signals turn into actionable insights after every session.",
    icon: "chart",
  },
  {
    tag: "Strava sync",
    title: "Connect in seconds",
    body: "Import history from Strava and let CyclogenAI handle sync, best efforts, and progress tracking.",
    icon: "sync",
  },
  {
    tag: "AI coach chat",
    title: "Ask anything, anytime",
    body: "Training questions, zone guidance, and race tactics — grounded in your actual ride data.",
    icon: "chat",
  },
  {
    tag: "Progress economy",
    title: "Momentum you can feel",
    body: "Streaks, milestones, and visual load trends keep consistency rewarding across the season.",
    icon: "trend",
  },
] as const;

export const STEPS = [
  {
    num: "01",
    title: "Connect your rides",
    body: "Link Strava and import power, HR, cadence, and recovery history in one step.",
  },
  {
    num: "02",
    title: "AI builds your plan",
    body: "Training load, periodization, and race goals merge into a structure that adapts every week.",
  },
  {
    num: "03",
    title: "Ride, refine, repeat",
    body: "Each session sharpens pacing targets, recovery windows, and what comes next — automatically.",
  },
] as const;

export const PRICING_FEATURES = [
  "AI-powered training plans",
  "Strava & device sync",
  "Race-day readiness tools",
  "Performance analytics dashboard",
  "AI coach chat",
  "Priority support",
] as const;

export const TESTIMONIALS = [
  {
    quote: "My FTP jumped 18 watts in 10 weeks. The adaptive plan just keeps working.",
    name: "Luca M.",
    role: "Amateur racer, Cat 3",
    avatar: "LM",
  },
  {
    quote: "Finally a training app that understands I'm not always fresh. It backs off when I need it.",
    name: "Sara K.",
    role: "Century rider",
    avatar: "SK",
  },
  {
    quote: "Won my first podium at a regional road race. CyclogenAI had me perfectly peaked.",
    name: "James R.",
    role: "Masters cyclist",
    avatar: "JR",
  },
] as const;

export const ABOUT_STATS = [
  { value: "10K+", label: "Active riders" },
  { value: "50K+", label: "Plans generated" },
  { value: "4.9", label: "Avg. rating" },
] as const;
