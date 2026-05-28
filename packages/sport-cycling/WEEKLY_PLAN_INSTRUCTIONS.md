# Weekly Plan Generation

You are creating a structured weekly training plan for a cyclist. Each day must specify: type of ride, approximate distance, zone-by-zone breakdown with timing, terrain, and weather.

## Output Format

Save the plan to the `WeeklyPlan` MongoDB model via the API. Each week contains 7 `workouts` (one per day):

```json
{
  "year": 2026,
  "week": 18,
  "startDate": "2026-05-04",
  "workouts": [
    {
      "dayOfWeek": 1,
      "type": "rest",
      "distance": 0,
      "zoneBreakdown": "",
      "terrain": "",
      "weather": "",
      "notes": "Full recovery. Stretch and foam roll."
    },
    {
      "dayOfWeek": 2,
      "type": "endurance",
      "distance": 45,
      "zoneBreakdown": "Warmup: 15min Z1→Z2 | Main: 60min Z2 steady | Cooldown: 10min Z1",
      "terrain": "rolling",
      "weather": "normal",
      "notes": "Keep HR in Z2. 85-95 RPM."
    }
  ],
  "coachNotes": "This is a build week. Focus on maintaining Z2 discipline."
}
```

## Zone Breakdown Convention

Every workout (except rest days) must include a `zoneBreakdown` string with this structure:

- **Warmup** — progressive build from Z1 to working zone, 10-15 min
- **Main set** — structured intervals or steady state with zone targets and durations
- **Cooldown** — 5-10 min Z1

Separate steps with `|`. Use format: `Z1 10min`, `Z4 5min × 4`, `Z2 between 3min`.

### Standard Workout Types

| Type | Zone | Duration | Frequency |
|------|------|----------|-----------|
| Rest | — | — | 1-2/week |
| Recovery | Z1 | 30-45min | 1-2/week |
| Endurance | Z2 | 45-180min | 2-4/week |
| Tempo | Z3 | 45-90min main | 1/week |
| Sweet Spot | Z4 (88-94%) | 30-75min main | 0-1/week |
| Threshold | Z5 (95-105%) | 20-60min main | 0-1/week |
| VO2max | Z6 (106-120%) | 15-25min main | 0-1/week |
| Race | — | varies | event day |

## Terrain Selection

Assign terrain based on the rider's location and the workout purpose:

| Terrain | When to Use |
|---------|-------------|
| flat | Recovery rides, time trial prep, beginner endurance |
| rolling | General endurance, tempo work, group ride simulation |
| hill | Threshold climbs, VO2max, strength endurance |
| mountainous | Race simulation, gran fondo prep, long climbs |

## Weather Consideration

Check the rider's location and date to determine realistic weather:

- **hot** (>30°C / 86°F): Reduce intensity expectations, flag hydration, suggest early morning
- **normal** (10-30°C / 50-86°F): Standard conditions
- **cold** (<10°C / 50°F): Suggest indoor alternative or extra layers
- **rainy**: Flag safety, suggest indoor if thunderstorm

Always include a realistic weather assessment based on the rider's location and the season. If weather data is unavailable, state the assumption clearly.

## Progressive Overload Rules

- Do not increase volume AND intensity in the same week
- Weekly volume increase: max 10% over trailing 4-week average
- After 3 build weeks → schedule a recovery week (60-70% volume)
- VO2max sessions: max 2x per week, never consecutive days
- Hard days should be followed by easy or rest days

## Periodization Context

Select the phase based on the rider's goal and current training block:

- **Base**: 85% Z1-Z2, 10% Z3, 5% Z4. Focus on volume.
- **Build**: 70% Z1-Z2, 20% Z3-Z4, 10% Z5+. Introduce intensity.
- **Peak**: 60% Z1-Z2, 25% race-pace, 15% Z6. Top-end work.
- **Taper**: 50% volume reduction, maintain intensity. Keep legs sharp.
- **Recovery**: 60-70% normal volume, all Z1-Z2.
