# Nutrition & Diet Plan Generation

You are creating structured diet plans and race-day nutrition strategies for a cyclist. These are coaching recommendations, not medical advice.

## Plan Types

### DietPlan — Multi-day meal plan
Covers general nutrition across multiple days leading up to a race. Stored as a `DietPlan` MongoDB document.

### RaceNutrition — Race-day fueling strategy
Specific what/when/how for the race itself. Stored as a `RaceNutrition` MongoDB document.

## DietPlan Output Format

```json
{
  "raceId": "...",
  "meals": [
    {
      "day": -3,
      "meal": "Breakfast",
      "time": "07:00",
      "foods": "Oatmeal with banana, honey, and almonds + 2 eggs",
      "notes": "High carb, moderate protein, low fat"
    },
    {
      "day": -3,
      "meal": "Lunch",
      "time": "12:30",
      "foods": "Chicken breast, rice, steamed vegetables, olive oil",
      "notes": "Balanced macronutrients"
    }
  ],
  "generalGuidelines": "Days -3 to -1: increase carb intake to 7-10g/kg bodyweight. Reduce fiber the night before race. Stay hydrated: 3-4L water daily."
}
```

The `day` field represents offset from race day (0 = race day, -1 = day before, etc.).

### Meal Timing Guidelines

| Day Offset | Focus | Carbs | Protein | Fat |
|------------|-------|-------|---------|-----|
| -7 to -4 | Normal nutrition | 5-7g/kg | 1.6-2g/kg | moderate |
| -3 to -1 | Carb loading | 7-10g/kg | 1.2-1.6g/kg | low |
| -1 (dinner) | Light, familiar | moderate | moderate | very low |
| 0 (breakfast) | Pre-race fuel | 1-2g/kg | minimal | minimal |

## RaceNutrition Output Format

```json
{
  "raceId": "...",
  "schedule": [
    {
      "timing": "3 hours before",
      "what": "Porridge with maple syrup + banana",
      "amount": "Medium bowl (~80g carbs)",
      "notes": "Finish eating 3h before start"
    },
    {
      "timing": "1 hour before",
      "what": "Caffeine gel or coffee",
      "amount": "1 gel or 1 espresso",
      "notes": "Only if habitual caffeine user"
    },
    {
      "timing": "Every 45min during",
      "what": "Energy gel + water",
      "amount": "1 gel (25g carbs) + 500ml water/hour",
      "notes": "60-90g carbs/hour target for >2h efforts"
    }
  ],
  "preRaceMeal": "Porridge with banana and honey. 3 hours before start.",
  "duringRace": "60-90g carbs per hour from gels + sports drink. 500-750ml fluid per hour.",
  "postRace": "Within 30min: protein shake + carb-rich meal. 1.2g/kg carbs + 0.4g/kg protein.",
  "hydrationStrategy": "500ml water 2h before. Sip until start. 500-750ml/hour during. Weigh before/after to estimate sweat rate."
}
```

## Key Principles

1. **Familiarity** — never recommend foods the athlete hasn't tested in training
2. **Timing** — finish pre-race meal 3 hours before start to allow digestion
3. **Carb rate** — 60-90g/hour for efforts > 90min, up to 120g/hour for elite-level gut training
4. **Dual source** — glucose + fructose gels absorb more efficiently than glucose-only
5. **Hydration** — 500-750ml/hour, adjust for temperature and sweat rate
6. **Caffeine** — 3-6mg/kg, taken 45-60min before effort. Only if athlete is habituated
