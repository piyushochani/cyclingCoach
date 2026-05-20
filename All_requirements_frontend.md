# CycloAI — Cycling Trainer Frontend: Complete Design & Prompt Document

---

## GLOBAL DESIGN SYSTEM

### Color Palette
- **Background (Dark):** `#0A0C0F` — near-black with a cold blue-black tint
- **Surface Cards:** `#111318` with `1px` border of `rgba(255,255,255,0.06)`
- **Primary Accent:** `#FF4C00` — aggressive Strava-orange, used for CTAs, active states, highlights
- **Secondary Accent:** `#FFD600` — electric yellow, used for coins, achievements, gold badges
- **Cool Blue:** `#3ECFFF` — used for data labels, secondary highlights, AI elements
- **Muted Text:** `#6B7280`
- **Body Text:** `#D1D5DB`
- **White:** `#F9FAFB`

### Typography
- **Display / Hero Font:** `"Barlow Condensed"` (Google Fonts) — Bold, tall, athletic. Used for headings, stats, hero text.
- **Body Font:** `"DM Sans"` — clean, geometric, modern. Used for paragraphs and labels.
- **Monospace / Data Font:** `"JetBrains Mono"` — for numbers, times, distances, stats.
- **Accent / Badge Font:** `"Bebas Neue"` — all caps, for section labels and unit text.

### Motion & Transitions
- **Page transitions:** Pages slide in from the right with a `0.4s` cubic-bezier ease, overlaid by a full-screen "wheel spin" wipe — a bicycle wheel SVG expands from center to full screen and retracts as the new page settles in.
- **Global loading overlay:** Semi-transparent frosted glass (`backdrop-filter: blur(16px)`) freezes the background. Centered is a cyclist SVG silhouette on a road. A progress bar styled as a chain-link strip runs beneath, filling from 0% to 100%. The chain links fill in one by one with the orange accent color. The percentage counter uses JetBrains Mono font.
- **Hover states:** Cards lift `4px` with a drop shadow glowing `rgba(255,76,0,0.25)`. Subtle orange border glow on focus/active.
- **Micro-interactions:** All numeric counters (kms, watts, coins) animate by counting upward from 0 on mount using a spring easing. Badges "pop" in with a scale bounce. Stats bars fill left-to-right with the chain animation.
- **Cursor:** Custom cursor — a tiny chainring icon that rotates on mouse movement. On hover over interactive elements it transforms into a gear-shift lever icon.

### Shared Components
- **Top Navigation Bar (post-login):** Fixed, `64px` tall, dark `#0A0C0F` background with a very subtle bottom border in `rgba(255,255,255,0.06)`. Left side: App logo (gear + cyclist icon + "CycloAI" in Barlow Condensed). Right side of logo: nav links — Dashboard, Activities, Training Calendar, Race Results, Statistics, AI Training. Active link has an underline that is styled as a bicycle chain (dashed pattern with orange color). Right side of navbar: Profile avatar circle + notification bell icon.
- **AI Chat Bot (bottom right, all pages post-login):** A floating button styled as a bicycle helmet icon in orange. On click, a chat drawer slides up from the bottom-right. The drawer has the frosted glass background. The bot is called "PaceBot". It has a typing indicator styled as three spinning chainrings. Messages from the bot have a small cyclist avatar.
- **Scrollbars:** Thin, `4px` width, orange thumb on dark track.
- **Toast Notifications:** Slide in from the bottom-right. Styled like a race bib number — rectangular, orange left border, bold race number font.

---

## PAGE 1 — LANDING PAGE

### Concept
A cinematic, full-screen experience evoking the feeling of cresting a mountain pass at dawn. Dark, high-contrast, dramatic. The hero is both an emotional statement ("You vs The Road") and a product pitch.

### Layout & Sections

**Navigation Bar (pre-login):**
Logo on the left: an animated SVG of a spinning chainring with "CycloAI" in Barlow Condensed, white. On the right: two buttons — `Log In` (ghost/outline style with white border) and `Sign Up` (solid orange fill, white text, slight skew/parallelogram shape like a race number plate).

**Hero Section (100vh, full screen):**
Background: A high-quality cycling photograph (a lone cyclist on a misty mountain road, shot from behind, silhouette against golden light) used as a full-screen background image with a dark overlay gradient from `rgba(10,12,15,0.3)` on the right to `rgba(10,12,15,0.85)` on the left side where the text lives. The image has a very subtle parallax scroll effect — it moves at 0.5x scroll speed.
Overlaid on the left half:
- Small all-caps label in orange Bebas Neue: `// AI-POWERED CYCLING INTELLIGENCE`
- Giant hero headline in Barlow Condensed Bold, white, 96px: "TRAIN SMARTER. RIDE FASTER." — the word "FASTER" is in orange.
- Subheadline in DM Sans, 18px, muted gray: "CycloAI learns your body, builds your plan, and rides with you through every kilometer — from coffee rides to race day."
- Two CTA buttons stacked: Primary — "Start Training Free" (large, orange, parallelogram). Secondary — "See How It Works" (ghost, with a downward arrow that animates bouncing).
- Below the CTAs, three inline stat pills: `685 Activities Tracked` · `2,400+ km Analyzed` · `AI-Personalized Plans` — each with a small icon (gear, road, brain).

**Floating Feature Cards (overlapping hero bottom):**
Three cards that overlap the hero section and the next section, creating a Z-depth layer. Each card is dark glass with orange accent top border. Cards:
1. **Smart Scheduling** — Gear icon. "AI builds weekly plans around your fitness, fatigue, and race calendar. It adapts in real-time."
2. **Race Intelligence** — Trophy icon. "Input your A-race. CycloAI reverse-engineers your entire season."
3. **Performance Coins** — Coin icon (gold). "Earn coins for every km, every PB, every hard effort. Gamified progression."

**How It Works Section:**
Dark background. Section header: "THE SYSTEM" in Barlow Condensed, 72px, with a very faint watermark of a bicycle wheel behind it. Three horizontal steps, each with a large step number (Bebas Neue, 120px, very faint), an icon, and a short description. Steps: 1) Connect your data (Strava import icon) → 2) AI builds your plan → 3) Race ready. Each step connected by a dashed line styled as a bicycle chain.

**Features Deep Dive Section:**
Alternating left-right layout. Feature 1 (left image, right text): "Weekly Mileage Graph" — screenshot mockup of the graph in a phone/dashboard mockup. Feature 2 (right image, left text): "AI Diet Plans" — a visual of a cyclist's meal plate. Feature 3: "Race Calendar Intelligence." Each section has an animated reveal on scroll (slide-in from side + fade).

**Social Proof / Stats Banner:**
Full-width dark orange-tinted strip. Large white numbers with orange labels: `685+` Activities · `53,000+` km Tracked · `12` Race Podiums · `4.9★` Rating.

**Footer:**
Dark, minimal. Logo on left. Links: About, Privacy, Terms. Right: "Made for cyclists, by cyclists." Subtle bicycle tire tread pattern as a top border.

---

## PAGE 2 — DASHBOARD / HOMEPAGE (Post-Login)

### Concept
The "cockpit" — dense but organized, like a bike computer display blown up to full screen. Every number matters. The left panel is the rider's identity pod, the right is the mission control for the week.

### Layout

**Top Grid Row (two panels side by side, full width):**

**LEFT PANEL — "Rider Pod" (roughly 40% width):**
Dark card with a subtle orange top-left corner accent line. Inside:

- *Cyclist animation (top, centered):* An SVG/Lottie animated cyclist on a stationary trainer. The cyclist is continuously pedaling (the legs, wheels, and chain all animate in a loop). On hover, the entire cyclist character rotates to face left — a smooth 180° horizontal flip with the bike leaning into the turn. The pedaling cadence speeds up when hovering over a "Sprint Mode" toggle.
- Below the cyclist, a row of **4 stat chips** in a 2x2 grid:
  - 🪙 **Coins Earned** (gold, JetBrains Mono font) — formula: `(total_km × 10) + (elevation_m × 0.5) + (hard_efforts × 50)`
  - 🚴 **KMs This Month** — orange counter
  - ⚡ **Performance Score** — blue, 0–100 scale with a small arc gauge
  - 🏆 **Achievements** — count with a badge icon that animates on hover
- Below the chips: **Achievement Badges** — a horizontal scroll row of unlocked badge icons (mountain climber, century rider, speed demon, consistency king, etc.), each circular with a gold ring. Locked badges are shown as dark silhouettes.
- At the very bottom of this panel: **AI Diet Plan** — a small card with a fork+road icon (cycling analogy). Shows today's suggested meal plan in 3 sections: Pre-ride fuel, On-bike nutrition, Recovery meal. Each meal has a calorie count, macro bar (carb/protein/fat split shown as a segmented progress bar styled as a handlebar tape color pattern). The diet is AI-generated based on today's planned workout intensity.

**RIGHT PANEL — "Mission Control" (roughly 60% width):**
Two sub-sections stacked:

- *Top of right panel:* A race countdown chip — "**14 weeks to Patas Race 2026**" in Barlow Condensed with a clock icon and a subtle pulsing orange glow. This is dynamically filled by the backend with the next priority race name and week countdown.
- *Below countdown:* **This Week's Training Schedule** — a horizontal 7-column layout (Mon–Sun). Each day column has:
  - Day label (Bebas Neue, small, muted)
  - A workout pill: if rest → gray "REST" tag; if planned → colored pill with sport icon (bike/run), duration, and intensity (Easy/Tempo/Intervals/Race). The pill color reflects intensity: green=easy, yellow=tempo, orange=hard, red=race/threshold.
  - Today's column has an orange column highlight/glow.
  - On hover of a workout pill, a tooltip appears with full details (target HR zone, target power, description).
- The schedule is AI-generated. A small "regenerate" button (refresh icon styled as a gear) is in the top-right of this panel.

**BOTTOM SECTION — Weekly Mileage Graph (full width):**
A custom area/line chart. Aesthetics: dark background, orange line with a gradient fill below it that fades to transparent, glowing data points. X-axis: months (Jan–Dec 2026). Y-axis: kilometers (0–200km range). Each data point represents one week's total distance. Hovering a data point:
- The point scales up with a glowing ring
- A tooltip panel slides in from the right side of the graph — styled as a race result card with:
  - Week date range (e.g., "May 18–24")
  - Total km, Total hours, Elevation gain
  - Activities list — each activity as a clickable row with sport icon, title, distance. Clicking opens that activity's detail page.
- Secondary line (dashed, blue) shows weekly hours (secondary Y-axis on right).
- A "this week" vertical marker (orange dashed line) always shows current week.
- Below the graph, small chips for each month show total monthly km.

---

## TOP NAVIGATION BAR (Post-Login)

Fixed, 64px height, on all pages post-login.
- **Left:** CycloAI logo (spinning chainring SVG + wordmark)
- **Center:** Nav links — `Dashboard` · `Activities` · `Training Calendar` · `Race Results` · `Statistics` · `AI Training`
  - Active state: The link text turns orange AND a small animated bicycle icon races along the bottom underline of the active link on hover/activation.
  - Link underline is styled as a dashed line (chain link pattern) in orange.
- **Right:** 
  - Notification bell (badge count). 
  - Profile avatar circle (rider photo or initials). On click: dropdown with Profile, Settings, Logout — styled as a gear-shift menu with gear numbers.
- On scroll down: navbar reduces height to `48px` and becomes more opaque (glass morphism effect with blur).

---

## PAGE 3 — ACTIVITIES PAGE

### Concept
A race results board meets a film strip. Every activity is a "stage" of your cycling story.

### Layout

**Header:**
"YOUR STAGES" in Barlow Condensed 72px with a faint bicycle wheel watermark. Subtitle: "Every kilometer, every climb, every story." Filter bar below: Sport type dropdown (All / Ride / Run), Date range picker, Distance range slider, Search by name. Sort options: Date, Distance, Elevation, Duration — each with up/down arrows styled as chain links.

**Activity List:**
Each activity is a full-width card with:
- Left: Sport icon in a colored circle (orange = Ride, green = Run)
- Sport badge pill (Ride / Run)
- Title in Barlow Condensed, large — clicking opens the Single Activity Page
- Date (DM Sans, muted)
- Three stat chips inline: Distance (km) · Moving Time · Elevation (m) — each with its own icon
- Right side: a mini elevation profile sparkline (SVG path) — a tiny mountain silhouette derived from the ride's elevation data
- A subtle background color shift on hover (card slides left `4px` and reveals an orange left border)
- Share and Edit actions as icon buttons (pencil = Edit, arrow = Share)

**Pagination / Infinite Scroll:**
Loading more activities triggers the cyclist loader. A counter at the top: "Showing 12 of 685 activities."

---

## PAGE 4 — SINGLE ACTIVITY PAGE

### Concept
Like a race stage debrief in a cycling newspaper. Dramatic, data-rich, immersive.

### Layout

**Hero Banner:**
Full-width, 280px tall. Background: the route map rendered as a static image (or live map). Overlaid with a dark gradient. On top: Activity title in Barlow Condensed 56px white. Date + location subtitle. Sport icon.

**Stats Row (below hero):**
Six stat cards in a horizontal row:
- Distance · Moving Time · Elevation · Avg Speed · Max Speed · Energy Output (kJ)
Each card: dark glass, number in JetBrains Mono large, label in Bebas Neue small. On mount, each number counts up from 0 with spring animation.

**Two-column main content:**

**Left Column:**
- **Interactive Map:** Full-height (min 400px). Route plotted as an orange line. Green dot = start, checkered flag = finish. Hover on map shows real-time elevation at that point. Clicking a point on the map highlights the corresponding point on the elevation chart below and vice versa.
- **Elevation Profile Chart:** Below the map. Area chart, orange fill, dark background. X-axis = km, Y-axis = altitude in meters. Hovering shows gradient %, altitude, and km at that point. Steep sections highlighted in a deeper red.
- **Split Table:** Km-by-km pace/speed table. Alternating dark rows. Fastest km highlighted orange, slowest km in blue.

**Right Column:**
- **Performance Dial:** A large circular gauge (like a speedometer) showing Performance Score for this activity (0–100). The needle animates sweeping in on page load.
- **Power/HR Chart (if data available):** A dual-line chart — orange = power (watts), blue = heart rate (bpm). Time on X-axis. Zone bands (Z1–Z5) shown as horizontal color bands behind the chart.
- **Laps / Segments section:** Collapsible accordion. Each segment shows name, distance, time, rank icon (if a PR: gold crown icon with animation).
- **Kudos & Comments:** Bottom of right column. Kudos shown as orange thumbs-up with count. Comment input styled as a race radio message input.

---

## PAGE 5 — BEST EFFORTS PAGE

### Concept
A personal Hall of Fame. Think Olympic record board meets road cyclist's trophy case.

### Layout

**Header:**
"BEST EFFORTS" with a podium icon. Subtitle: "Your fastest segments across all distances."

**Distance Category Tabs:**
Horizontal tab bar styled as a gear cluster: 400m · 1km · 5km · 10km · Half Marathon (run) · 1hr Power · etc. The active tab has a spinning gear icon.

**Efforts Table for each category:**
Columns: Rank · Activity Title · Date · Time · Pace/Speed · vs PR (delta, green if improved, red if not). Top 3 rows have gold/silver/bronze left border stripes and subtle metallic shimmer effect. On hover: row expands to show a mini sparkline of that segment's effort vs previous bests.

**PR Timeline Chart:**
A line chart showing progression of a selected distance over time. When you improve, the line drops (for time) and an explosion emoji + coin animation plays.

---

## PAGE 6 — TRAINING CALENDAR

### Concept
Inspired by the classic race bible / road book. Each week is a "stage." The calendar is your race roadmap.

### Layout

**Header:**
"TRAINING CALENDAR" — Barlow Condensed, large. Sub-label: AI-generated plan active. A toggle: "Calendar View / Log View."

**Log View (Training Log):**
Replicates the Strava Training Log UI but heavily restyled:
- Background: dark `#0A0C0F`
- Week rows are separated by full-width subtle dividers styled as road centerlines (dashed white line on dark asphalt texture)
- Week label on the left (e.g., "May 18–24") with total distance and total time as sub-stats
- Each day column: day bubbles (circles) that scale with distance — larger bubble = more km, per the original Strava training log style. Color: orange for rides, green for runs. On hover: tooltip card with activity name, distance, time, elevation.
- Clicking a bubble: opens that activity's detail page
- Empty day columns show a subtle "Rest" or "Planned" state (AI-planned workouts shown as dashed-border circles)

**Calendar View:**
A full monthly calendar grid. Each day cell shows:
- Planned workout pill (AI-generated, dashed border)
- Completed workout pill (solid fill, orange/green)
- Day cells with both show a "completed vs planned" comparison
- Clicking a day: a side drawer slides in from the right showing full day details (planned vs actual, AI coach note for that day)

**Week Summary Sidebar:**
Fixed right sidebar (collapsible). Shows: TSS (Training Stress Score), weekly km, weekly hours, weekly elevation, form/fitness/fatigue lines (CTL/ATL/TSB styled as three animated lines with color-coded zones).

---

## PAGE 7 — AI TRAINING PAGE

### Concept
Mission control for your race season. Futuristic, data-command aesthetic. Like a NASA flight director console but for cycling.

### Layout

**Header:**
"AI TRAINING COMMAND" — with a blinking cursor animation after "COMMAND". Subtitle: "Your AI coach is analyzing your data..." with a subtle typewriter animation.

**Race Scheduler Section:**
Left side: A "Schedule Race" button — large, orange, with a `+` icon and the text "ADD RACE TARGET". The button has a pulsing animation like a race start countdown light. On click: a full-screen modal appears with a dark frosted glass overlay.

**Schedule Race Modal:**
The modal is styled like a race entry form / race bib. Fields:
- Race Name (text input)
- Race Type (segmented control: "Road Race" / "Time Trial" / "Criterium" / "Gran Fondo" / "Gravel")
- Race Date (date picker)
- Location (text input with map pin icon)
- Distance (km slider + manual input)
- Elevation Gain (m slider + manual input)
- Race Priority (segmented: A-Race / B-Race / C-Race — explained with tooltips: A = peak for this, B = secondary, C = participation)
- Expected Weather Conditions (optional, dropdown: Hot / Cold / Wet / Mixed)
- Course Description (textarea: "Describe the terrain, key climbs, technical sections...")
- Personal Goal (text: "What's your target for this race?")
Submit button: "LOCK IN TARGET" (orange, full-width, with a lock animation on click)

**Upcoming Races Table:**
Below the scheduler button. Table with a dark header row. Columns:
- Race Name (bold, Barlow Condensed)
- Race Type (pill badge: Road/TT/Crit, each different color)
- Location (with a small map pin icon)
- Distance (km)
- Date (with a "X weeks away" countdown in orange)
- Description (truncated text, expand on click)
- On-Ride Nutrition Plan (this column shows either: a lock icon with "Available 2 weeks before race" in gray, or when within 2 weeks: an orange "View Plan" button that opens a nutrition modal)
- Priority Badge (A/B/C in styled badges)
- Actions: Edit / Delete

**Nutrition Plan Modal (within 2 weeks):**
Opens as a side drawer. Shows:
- Pre-race meal (night before + race morning)
- On-bike nutrition strategy: gels/bars timeline by km (shown as a horizontal timeline with fuel icons at each marker)
- Hydration plan (ml per hour)
- Post-race recovery

**AI Plan Overview Section:**
Below the race table. An AI-generated text card styled like a coach's letter — typewriter font (monospace), on a dark "paper" background with a subtle noise texture. It says things like: "Given your current fitness (53km ride this week), and Patas Race 2026 in 14 weeks, here's your periodization plan..." Followed by a visual periodization timeline (base → build → peak → taper blocks shown as a horizontal bar chart with labels).

---

## PAGE 8 — RACE RESULTS PAGE

### Concept
A trophy room / hall of fame. Cinematic, reverent. Each race is a chapter in the rider's story.

### Layout

**Header:**
"RACE HISTORY" — with a checkered flag SVG animation waving on the right side of the header. Subtitle: "Every finish line you've crossed."

**Race History Cards:**
Each completed race is a large card. Layout inside each card:
- Left: Race name in Barlow Condensed 36px. Below: Race type badge + Location + Date
- Center: Key stats — Distance · Elevation · Official Time · Avg Power (if available)
- Right: Ranking display — a large circular badge styled as a race number plate (rectangular, orange/yellow border, bold number). Shows the user's finishing position. Below it: the total field size ("12th of 87 riders").
- Below the main row: an "Experience" section — a text area where the user wrote their race story. Shown as a quote block with an italicized DM Sans font. A small "Edit Story" icon (pencil) in the corner.
- On hover: the card lifts and the background subtly shows a faint route map of that race.

**Add Race Result Button:**
Floating orange `+` button in the bottom center. On click: a modal to add a new race result. Fields: Race name, type, date, location, distance, elevation, finishing time, finishing position, total field, race experience (long textarea).

**Season Summary Bar:**
Top of the page, a horizontal stats strip: Total Races This Season · Best Finish · Total Race Km · Total Elevation in Races · Podiums.

**Achievements Unlocked from Races:**
Below the race list, a "Race Badges" section showing earned badges (First Race, First Podium, Century Racer, Mountain Goat, etc.) with unlock animations when new ones appear.

---

## PAGE 9 — STATISTICS PAGE

### Concept
A data analyst's wall, but beautiful. Think Bloomberg Terminal meets cycling magazine infographic.

### Layout

**Header:** "YOUR NUMBERS" with a real-time updating clock showing total lifetime km to date, ticking up at a rate that represents their average km/hour.

**Top Stats Row:**
Six large stat tiles: Total Lifetime km · Total Elevation (styled "You've climbed X Everests") · Total Moving Hours · Longest Ride · Fastest km · Total Calories.

**Charts Section (2x2 grid):**
1. **Monthly Distance Bar Chart** — 12 months, orange bars, current month bar has a glow.
2. **Sport Distribution Pie Chart** — styled as a bicycle wheel: each sport is a spoke section, colored differently. Ride = orange, Run = green, etc.
3. **Elevation Per Month Line Chart** — blue line with mountain silhouette fill below.
4. **Performance Score Trend** — an area chart showing 0–100 score over weeks.

**Heatmap Calendar:**
A full-year GitHub-style heatmap but styled as a cycling track oval (oval grid layout). Each cell = one day. Color = activity intensity (darker orange = harder day, gray = rest). Hover shows day's stats.

**Personal Records Table:**
Tabbed by sport. Shows all-time PRs for key distances. Each PR has a "set on [date]" label and a sparkline showing PR progression over time.

---

## GLOBAL CYCLIST LOADER (Reusable Component)

**Trigger:** Any async operation, page navigation, or data fetch.
**Implementation:**
- Background content gets `backdrop-filter: blur(8px) brightness(0.4)` — it freezes and blurs behind the loader
- A centered modal (no background box, just floating elements):
  - An SVG animated cyclist silhouette — the legs pedal, the wheels spin, the bike bobs slightly
  - Below the cyclist, a horizontal road stretches left and right with dashed center line
  - The road has a progress bar built into it — the dashed centerlines fill in with orange from left to right
  - Below the road: a percentage in JetBrains Mono `48px` orange: "47%"
  - A small label in Bebas Neue gray: "LOADING DATA..."
- The cyclist moves from the left end to the right end of the road as progress goes 0→100%
- On completion: cyclist reaches the finish line (a checkered flag icon) with a small confetti burst

---

## ADDITIONAL CREATIVE DETAILS

- **Empty States:** When a section has no data, instead of a generic "No data" message, show an illustrated cyclist at a fork in the road with the message: "No rides here yet. Your next adventure is one pedal stroke away." The CTA button says "Log an Activity."
- **Error States:** Styled as a mechanical breakdown — a broken chain SVG with the message: "Chain dropped. We'll get you back on the road."
- **Success Toasts:** Styled as a race radio message: "🎙️ DIRECTOR SPORTIF: Activity saved successfully!"
- **Tooltip Styling:** Dark glass pill with orange dot, no arrow, appears above the element with a slight upward float animation.
- **Number Formatting:** All distances use one decimal place + "km". Times use `h:mm:ss`. Elevation uses "m". Watts use "W". These are always in JetBrains Mono.
- **Mobile Responsive Breakpoints:** Below 768px, the left/right panels stack vertically. The weekly schedule collapses into a horizontal scroll row. The cyclist in the rider pod stays and continues animating. The chat bot button becomes smaller (40px).
- **Keyboard Shortcuts Overlay:** Press `?` to show a cycling-themed shortcuts modal — shortcuts listed like race stage directions.
