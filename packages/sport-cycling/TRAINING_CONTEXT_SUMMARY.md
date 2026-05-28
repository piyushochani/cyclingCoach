# Training Context Summary Generation

You are summarizing training data into structured context documents that will be fed back to the AI as memory during future coaching sessions. Accuracy and conciseness are critical.

## Context Types

Two types of context documents are maintained:

### MonthContext — Rolling 2-month window
One document per month. Only the last 2 months are kept; older ones are automatically rotated out.

### WeekContext — Rolling 2-week window  
One document per week. Only the last 2 weeks are kept; older ones rotated out.

## Month Summary Format

For each month, compute and store:

```json
{
  "year": 2026,
  "month": 4,
  "summary": {
    "totalDistance": 1200.5,
    "totalDuration": 48000,
    "totalElevation": 8500,
    "activityCount": 22,
    "rideCount": 18,
    "sportDistribution": { "cycling": 18, "running": 3, "workout": 1 }
  },
  "rawText": "April 2026: 1200km over 18 rides + 3 runs (22 sessions total). 8500m elevation. ~40h total training time. Key sessions: hill repeats (650m elev), 110km endurance ride, 92km weekend ride. Consistent 5-6 rides/week pattern. Volume building toward June gran fondo."
}
```

The `rawText` field is the LLM-facing summary. Write it as a single paragraph covering:
1. **Headline numbers** — total distance, rides, time, elevation
2. **Key sessions** — notable efforts (longest ride, hardest interval session, biggest climbing day)
3. **Consistency signal** — how many days/week, any gaps
4. **Training phase** — base building, intensity introduction, peak, taper
5. **Trend** — rising/stable/declining vs previous month

Keep it under 200 characters. The LLM will read this as compressed memory — every word should carry signal.

## Week Summary Format

For each week, compute and store:

```json
{
  "year": 2026,
  "week": 18,
  "summary": {
    "totalDistance": 280.0,
    "totalDuration": 10200,
    "totalElevation": 2100,
    "rideCount": 5,
    "daysRidden": 5,
    "longestRide": 92.3
  },
  "rawText": "Week 18: 280km, 5 rides, 5 active days. Longest: 92km weekend ride (720m elev). Hill repeats midweek. Good consistency, 1 rest day. Moderate load week."
}
```

Week `rawText` is even shorter — aim for under 120 characters. Cover:
1. Volume (distance + rides)
2. Notable session
3. Consistency flag
4. Load assessment (easy/moderate/hard)

## Rotation Rules

- **Months**: Always keep exactly the last 2. When a new month starts, drop the 3rd-oldest.
- **Weeks**: Always keep exactly the last 2. When a new ISO week starts, drop the 3rd-oldest.
- Rotation is automatic via the API. You only need to upsert the current period.

## When to Generate

Generate/update MonthContext:
- When the month changes (on or after the 1st of the new month)
- When explicitly asked to summarize

Generate/update WeekContext:
- When the ISO week changes (every Monday)
- When explicitly asked to summarize

For both: always query the most recent activities to compute accurate aggregates.
