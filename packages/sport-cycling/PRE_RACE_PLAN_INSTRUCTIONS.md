# Pre-Race Week Plan Generation

You are creating week-by-week training plans leading up to a race. Each plan covers one week at a specific offset before race day.

## Output Format

Save each week as a separate `PreRaceWeekPlan` document via the API:

```json
{
  "raceId": "...",
  "weekOffset": -4,
  "label": "4 Weeks Out — Build",
  "startDate": "2026-04-20",
  "workouts": [
    {
      "dayOfWeek": 1,
      "type": "rest",
      "distance": 0,
      "zoneBreakdown": "",
      "terrain": "",
      "weather": "",
      "notes": "Rest day"
    },
    {
      "dayOfWeek": 2,
      "type": "sweet-spot",
      "distance": 50,
      "zoneBreakdown": "Warmup: 15min Z1→Z2 | Main: 3×15min Z4 (88-94%) with 5min Z2 recovery | Cooldown: 10min Z1",
      "terrain": "rolling",
      "weather": "normal",
      "notes": "Focus on steady power through each interval. 85-95 RPM."
    }
  ],
  "coachNotes": "This week continues threshold development. Race simulation starts next week."
}
```

## Week Structure by Offset

### 4 Weeks Out (Week -4) — Build
- 1 VO2max session (e.g. 5×4min)
- 1 threshold session (e.g. 3×10min)
- 1 long endurance ride at race distance × 80%
- 1 tempo ride
- 2-3 easy/recovery days

### 3 Weeks Out (Week -3) — Peak Intensity
- 1 threshold session (e.g. 2×20min)
- 1 race-sim session (distance at race pace with race-like terrain)
- 1 long ride at race distance × 90%
- 1-2 easy/recovery days

### 2 Weeks Out (Week -2) — Taper Start
- Volume reduced 30%
- 1 threshold session (short: 2×12min)
- 1 openers session (40min with 3×30s sprints)
- No VO2max work
- 1 moderate endurance ride

### 1 Week Out (Week -1) — Race Week
See full race-week structure below.

## Race-Week Schedule (7 Days Before)

### 7 Days Out
- Short ride with 2×5min at threshold
- Begin carb-loading if appropriate

### 5 Days Out
- Easy endurance 45-60min Z2

### 3 Days Out
- Short ride with openers: 3×1min at race pace

### 2 Days Out
- Rest or 30min easy spin

### 1 Day Before
- Short opener: 20min warmup, 3×30s hard, 10min cooldown
- Check equipment and nutrition

### Race Day
- Warmup: 15-20min progressive + 2×1min at race intensity
- Start conservative

## Terrain Specificity

Match workout terrain to the race profile when possible:

- If race is mountainous → prescribe climbs in Z4-Z5
- If race is flat → prescribe steady threshold at race pace
- If race is rolling → prescribe variable pace intervals

## Taper Rules

- Reduce volume, NOT intensity
- Week -2: 70% of peak volume
- Week -1: 50% of peak volume
- Maintain 1-2 short threshold efforts to keep legs sharp
- Remove all VO2max work by week -2
- Openers session 2-3 days before race day
