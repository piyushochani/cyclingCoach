# CycloAI — Frontend Sub-Task Prompts (Sequenced)

Each task builds on the previous. Complete them in order.
At the start of every task, paste the **Design Token Reference** (Task 0) as context.

---

## TASK 0 — Design Token Reference (Paste this into every subsequent task as context)

```
CYCLOAI DESIGN SYSTEM — always follow this in every component you build:

COLORS:
  --bg-base: #0A0C0F
  --bg-surface: #111318
  --accent-orange: #FF4C00
  --accent-yellow: #FFD600
  --accent-blue: #3ECFFF
  --text-muted: #6B7280
  --text-body: #D1D5DB
  --text-white: #F9FAFB
  --border-subtle: rgba(255,255,255,0.06)
  --glow-orange: rgba(255,76,0,0.25)

FONTS:
  Display/headings → "Barlow Condensed" Bold (Google Fonts)
  Body/labels      → "DM Sans" (Google Fonts)
  Numbers/data     → "JetBrains Mono" (Google Fonts)
  Badges/units     → "Bebas Neue" (Google Fonts)

GLOBAL RULES:
  - All cards: background #111318, 1px border rgba(255,255,255,0.06), border-radius 12px
  - Card hover: translateY(-4px), box-shadow 0 8px 32px rgba(255,76,0,0.25)
  - All stat numbers animate counting up from 0 on mount (spring easing, 1.2s)
  - All async actions show the CyclistLoader (defined in Task 1)
  - Orange CTA buttons are slightly parallelogram-skewed (skewX(-6deg) on inner span)
  - Scrollbar: 4px width, #FF4C00 thumb, #111318 track
  - All pages have background #0A0C0F, no white backgrounds anywhere post-login
```

---

## TASK 1 — Global Foundation: Design System, Cyclist Loader & Shared Utilities

**What to build:**
Create the foundational layer that every other page will import. This is a React project using Tailwind CSS + custom CSS variables. Build the following as exportable components/utilities:

**1A. CSS Variables & Global Styles (`globals.css`):**
Define all CSS custom properties from the Design Token Reference above. Add a global scrollbar override (4px, orange thumb). Add a subtle `@keyframes` for the "chain-fill" animation (a progress bar that fills left-to-right with a dashed chain-link pattern in orange). Add `@keyframes chainRoll` (infinite horizontal scroll of chain links used as decorative dividers).

**1B. CyclistLoader Component:**
A full-screen overlay component triggered during any async operation. Implementation:
- The entire background behind it gets `backdrop-filter: blur(8px) brightness(0.4)` — frozen and blurred
- Centered on screen: an SVG animated cyclist silhouette — the cranks rotate, the wheels spin (two circles with spoke lines rotating), the rider's legs pump up and down in a loop using CSS `@keyframes`
- Below the cyclist, a horizontal road element — a dark strip with a dashed white centerline. The centerline dashes are individual `<span>` elements that fill with orange one-by-one left-to-right to represent progress
- The cyclist SVG translates from left to right across the road as progress goes 0%→100%
- Below the road: `{percentage}%` in JetBrains Mono 48px orange
- Below that: a small label in Bebas Neue gray — "LOADING DATA..."
- When progress hits 100%: cyclist reaches a checkered flag SVG on the right, a small confetti burst (CSS-only, colored divs exploding outward), then the overlay fades out
- Props: `{ isLoading: boolean, progress: number (0-100), message: string }`

**1C. Custom Cursor:**
A global cursor override. Replace the default cursor with a tiny (24×24px) SVG chainring (a circle with 8 teeth around it). It rotates clockwise continuously at 2rpm using CSS animation. On hover over any `button`, `a`, or `[role="button"]`: the cursor transitions to a gear-lever icon (a straight line with a ball at the top, like a gear shifter). Implement via a floating `div` that follows `mousemove` events.

**1D. Toast Notification Component:**
Slides in from bottom-right. Styled as a race bib: rectangular card, orange left border (4px), race bib number in Bebas Neue top-right corner (auto-incrementing), message in DM Sans. Variants: success (green left border + "🎙️ DIRECTOR SPORTIF:" prefix), error (red left border + "⚠️ MECHANICAL:" prefix), info (blue left border). Entry animation: slides up from `translateY(100%)` with spring bounce.

**1E. Page Transition Wrapper:**
Wraps every route. On route change: a bicycle wheel SVG (spokes radiating from center) scales from `0` to `200vw` from the center of the screen (like a wipe), then scales back to `0`, revealing the new page underneath. Duration: 600ms total (300ms expand, 300ms contract). The wheel is dark `#0A0C0F` fill. Implement as a React context + component.

**Creative requirements:**
- The cyclist loader should feel alive — not stiff. The leg pumping should have slight easing (not linear). The wheel spokes should blur slightly at speed.
- The chainring cursor must be crisp and feel like a real UI detail, not a gimmick.
- Every `@keyframes` name should be cycling-themed (e.g., `@keyframes pedalStroke`, `@keyframes wheelSpin`, `@keyframes chainRoll`).

---

## TASK 2 — Landing Page (Pre-Login, Full Marketing Page)

**Context:** Import the Design System from Task 1. This page uses React + CSS modules/Tailwind. No auth state needed. Two buttons link to `/login` and `/signup`.

**What to build:**

**2A. Navbar (pre-login):**
Fixed top, full width, initially transparent, transitions to `#0A0C0F` with `backdrop-filter: blur(12px)` on scroll past 80px. Left: CycloAI logo — an SVG chainring that spins on hover + "CycloAI" in Barlow Condensed 24px white. Right: `Log In` button (outlined, white border, white text, hover: fills orange) and `Sign Up` button (solid orange, white text, parallelogram shape using `clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)`). Smooth underline animation on nav hover states.

**2B. Hero Section (100vh):**
Background: a high-resolution cycling image — a lone cyclist on a misty mountain road, shot from behind, silhouette against golden-hour light. Use `https://images.unsplash.com/photo-1534787238916-9ba6764efd4f` or similar free cycling Unsplash image. Apply a CSS gradient overlay: `linear-gradient(to right, rgba(10,12,15,0.88) 40%, rgba(10,12,15,0.2) 100%)`. The image has `background-attachment: fixed` for a parallax effect on scroll.

Left half content (staggered entrance animation — each element fades+slides up with 150ms delay between them):
- Small pill label: `// AI-POWERED CYCLING INTELLIGENCE` — Bebas Neue, orange, with a blinking cursor animation
- Hero headline in Barlow Condensed Bold 96px white, two lines: "TRAIN SMARTER." / "RIDE **FASTER**." — the word FASTER is in `--accent-orange`
- Subtext in DM Sans 18px `--text-body`: "CycloAI learns your physiology, builds your plan, and rides with you through every kilometer — from coffee rides to race day."
- Two CTA buttons with 16px gap: Primary — `"Start Training Free"` (large orange parallelogram, arrow icon animates rightward on hover). Secondary — `"See How It Works"` (ghost, white border, downward arrow icon bouncing)
- Below CTAs: three inline stat pills in DM Sans small — each has an icon: `🔄 685 Activities Tracked` · `📍 2,400+ km Analyzed` · `🧠 AI-Personalized Plans`

Right half: the cycling image bleeds through unobstructed.

**2C. Feature Cards Row (overlapping hero/next section):**
Three cards that break the section boundary — they sit `translateY(-50%)` relative to the next section, creating a Z-depth overlap. Each card: dark glass (`background: rgba(17,19,24,0.9)`, `backdrop-filter: blur(8px)`), 3px orange top border, subtle entrance animation on scroll (Intersection Observer). Cards:
1. ⚙️ **Smart Scheduling** — "AI builds weekly plans around your fitness, fatigue, and race calendar. Adapts every Monday."
2. 🏆 **Race Intelligence** — "Set your A-race. CycloAI reverse-engineers your entire season backward from race day."
3. 🪙 **Performance Coins** — "Earn coins for every km, every PB, every hard effort. Gamification meets periodization."

**2D. How It Works Section:**
Dark background. Section label in Bebas Neue orange small caps: `THE SYSTEM`. Behind the heading: a very large faint bicycle wheel SVG watermark (opacity 0.03, `position: absolute`).
Three numbered steps in a horizontal row connected by a chain-link dashed line (CSS `border-top: 2px dashed rgba(255,76,0,0.4)` with a custom dash pattern). Each step has a giant step number in Barlow Condensed (120px, opacity 0.06 as background), an icon circle (orange ring), and 2 lines of text. Steps:
1. **Connect** — Import from Strava or log manually
2. **Analyze** — AI maps your fitness, history, and goals
3. **Execute** — Follow your personalized plan to race day

**2E. Stats Banner:**
Full-width strip with `background: linear-gradient(135deg, #FF4C00 0%, #CC3A00 100%)`. Four large white stats: `685+` Activities · `53,000+` km Ridden · `12` Race Podiums · `4.9★` Avg Rating. Each number in Barlow Condensed 64px white. On scroll into view: numbers count up from 0.

**2F. Footer:**
Dark, minimal. Left: logo. Center: Links (About, Privacy, Terms) in DM Sans small gray. Right: "Made for cyclists, by cyclists." in DM Sans italic. Top border styled as a bicycle tire tread pattern using a repeating CSS `background-image` with alternating dark/slightly-lighter rectangles.

**Creative requirements:**
- The parallax hero image must feel cinematic, not just a background image. Use `will-change: transform` for smooth scrolling performance.
- The staggered hero text entrance should feel like a race countdown — each element dropping into place.
- The step connector chain should visually animate when scrolled into view (chain fills left-to-right).
- Hero must work on mobile: at `<768px` remove the right-side image bleed and center all content. Font sizes scale down (96px → 52px for headline).

---

## TASK 3 — Authentication Pages: Login & Signup

**Context:** Import Design System from Task 1. These are split-screen pages. Left side = cycling visual. Right side = form.

**What to build:**

**3A. Shared Auth Layout:**
Two-column split: Left 45% — a dark panel with a looping animated SVG scene of a cyclist riding through different environments (day/night cycle, flat road, then a climb — transitions every 8 seconds with a crossfade). The panel has an orange gradient overlay strip at the bottom with a motivational cycling quote in Barlow Condensed italic white (rotates between 3 quotes on a 6s interval). Right 55% — the form area, background `#0A0C0F`.

**3B. Login Page (`/login`):**
Form fields on the right panel:
- "WELCOME BACK" in Barlow Condensed 48px white, sub-label "Resume your training." in DM Sans muted
- Email input: dark surface card style (`#111318` background, `1px rgba(255,255,255,0.06)` border, orange focus glow). Left icon: envelope icon
- Password input: same style, left icon: lock icon, right icon: eye toggle
- "Forgot password?" link in orange small
- Login button: full-width orange parallelogram, Barlow Condensed "CLIP IN →" text (cycling pun for "log in")
- Divider: "or continue with" with Strava OAuth button (Strava orange color, Strava logo SVG)
- Bottom: "No account? Sign Up" link
On submit: triggers CyclistLoader (from Task 1) while auth is processing.

**3C. Signup Page (`/signup`):**
Fields: Name · Email · Password · Confirm Password · "What's your main sport?" (segmented: Cycling / Triathlon / Running with bike/run icons) · "What's your experience?" (beginner/intermediate/advanced with icon pills)
Submit button: "START YOUR JOURNEY →" in Barlow Condensed orange
Success state: the CyclistLoader plays to 100%, then confetti, then redirects to `/dashboard`.

**Creative requirements:**
- The left-panel cyclist animation should feel environmental — use CSS + SVG to suggest motion blur on the bike wheels, parallax road lines scrolling beneath the bike.
- Input focus states must have a subtle orange glow (`box-shadow: 0 0 0 2px rgba(255,76,0,0.4)`), never a generic blue browser outline.
- The Strava connect button should have a subtle pulsing glow to draw attention.
- Error states: the input border turns red, a small "⚠️ MECHANICAL:" prefix appears in the error message (consistent with toast system from Task 1).

---

## TASK 4 — Top Navigation Bar & PaceBot Chat Widget (Post-Login Shared Components)

**Context:** Import Design System from Task 1. These are global components rendered on every post-login page.

**What to build:**

**4A. Top Navigation Bar:**
Fixed, full width, z-index 1000. Height: 64px (shrinks to 48px with increased opacity on scroll). Background: `rgba(10,12,15,0.8)` with `backdrop-filter: blur(12px)`, bottom `1px` border `rgba(255,255,255,0.06)`.

Left: CycloAI logo (spinning chainring SVG + wordmark in Barlow Condensed 20px white). On hover, the chainring accelerates its spin (CSS transition on `animation-duration`).

Center: Nav links — `Dashboard` · `Activities` · `Training Calendar` · `Race Results` · `Statistics` · `AI Training`. Each in DM Sans 14px `--text-body`. Active/current page: text turns orange + an underline that is specifically styled as a chain — a row of small oval links in SVG rendered as a CSS `background-image` on a `::after` pseudo-element, in orange. Hover on inactive link: a small bicycle icon (🚲 as SVG, not emoji) animates sliding along the underline from left to right over 0.3s.

Right: Notification bell icon (with a small orange badge count). Profile avatar (40px circle, rider photo or initials in orange ring). Clicking the avatar opens a dropdown styled as a gear-shift console: the dropdown container has gear teeth on the left edge (decorative SVG). Items: Profile Settings, My Bikes, Connect Strava, Logout (styled in red).

Mobile (`< 768px`): center links collapse into a hamburger menu. Menu opens as a full-height side drawer from the left, dark with chain-link decorative border on right edge.

**4B. PaceBot Chat Widget:**
A floating action button fixed to the bottom-right at all times on post-login pages. The button is a 56px circle, orange, containing a bicycle helmet SVG icon (white). On hover: `scale(1.1)` + orange glow pulse.

On click: a chat drawer animates up from the bottom-right — `400px` wide, `520px` tall. The drawer has:
- Header: "PaceBot 🚴" in Barlow Condensed white, subtitle "Your AI training coach" in DM Sans small muted. A minimize `—` button top-right.
- Message area: dark `#111318` background, subtle scrollable. Bot messages have a small cyclist avatar (tiny orange circle with a rider silhouette). User messages align right, orange bubble.
- Typing indicator: three small chainring SVG icons (tiny circles with spokes) that spin sequentially — left, center, right — like a loading animation, instead of the typical three dots.
- Input area: dark input field with "Ask PaceBot anything..." placeholder in muted. Send button: orange circle with a → arrow. On press Enter or click: message sends.
- The drawer entry animation: slides up from `translateY(100%)` + fades in over 300ms.
- On first open: PaceBot sends a greeting: "Hey Piyush! 🚴 You crushed 53.66km this morning. Ready to plan your recovery?"

**Creative requirements:**
- The chain-link nav underline is the most important detail here — it must look unmistakably like a bicycle chain, not a dashed line.
- The gear-shift dropdown must feel tactile — add a subtle `click` CSS sound-analog via scale micro-animation on each menu item hover.
- PaceBot's typing indicator (three spinning chainrings) is a signature interaction — implement it with care. Each ring should have a slightly different `animation-delay` to create a wave.

---

## TASK 5 — Dashboard / Homepage

**Context:** Import Design System (Task 0), PageTransition + CyclistLoader (Task 1), Navbar + PaceBot (Task 4). Route: `/dashboard`. Use mock JSON data for all values (define a `mockDashboardData.js` file with sample stats, schedule, and weekly mileage data).

**What to build:**

**5A. Top Row — Two Panels Side by Side:**

**Left Panel — "Rider Pod" (40% width, full height ~480px):**
Dark card. Orange top-left corner accent: a 2px L-shaped line in orange (`border-top` + `border-left` on a pseudo-element, spanning 40px). Inside:

*Animated Cyclist (top center of card):*
An SVG cyclist on a road bike. Components that animate:
- Cranks + pedals rotate continuously at ~80rpm (CSS `@keyframes pedalStroke`, infinite)
- Both wheels spin (CSS `@keyframes wheelSpin`, infinite, `transform-origin: center`)
- The rider's torso bobs very slightly up/down (subtle, 0.5s period) to simulate road vibration
- On hover over the card: the entire cyclist assembly rotates 180° around the Y-axis (`rotateY(180deg)`) over 0.8s with a `ease-in-out` curve. This simulates the bike turning around. The pedaling continues throughout.
- A "Sprint Mode" toggle button (lightning bolt icon) below the cyclist: when toggled ON, the `animation-duration` of pedalStroke and wheelSpin halves (doubling the apparent cadence). The rider torso bob increases amplitude.

*Stats Grid (2×2, below cyclist):*
Four stat chips, each a mini dark card inside the panel:
1. 🪙 **Coins** — `2,847` in JetBrains Mono gold (`--accent-yellow`). Label "COINS EARNED" in Bebas Neue small orange.
2. 🚴 **Monthly km** — `312.4 km` in JetBrains Mono orange. Label "THIS MONTH" in Bebas Neue muted.
3. ⚡ **Performance Score** — A small arc gauge (SVG semicircle, 0–100 scale, filled with orange gradient). Score `74` in JetBrains Mono white center. Label "PERF SCORE" below.
4. 🏆 **Achievements** — `12` in JetBrains Mono yellow. Label "UNLOCKED" in Bebas Neue. A small badge icon animates rotating on hover.

*Achievements Row (below grid):*
A horizontally scrollable row of badge circles (40px each). Unlocked badges: full color with gold ring and a subtle shimmer `@keyframes` passing left-to-right. Locked badges: grayscale, opacity 0.3, lock icon overlay. Badge types (with cycling names): 🗻 "King of Mountains", ⚡ "Sprinter", 🕐 "Century Club", 📅 "Iron Routine", 🌅 "Dawn Patrol", 🐢 "Endurance Beast". On badge hover: a tooltip pops showing unlock criteria.

*AI Diet Plan (bottom of left panel):*
A sub-card inside the panel with a fork+crank icon (creative cycling+food mashup SVG — a fork where the handle is shaped like a crank arm). Today's date + "Fueling Plan." Three rows:
- Pre-ride: meal name + calories + a macro bar (segmented horizontal bar: carbs=orange, protein=blue, fat=gray — styled to look like handlebar tape color sections)
- On-bike: gel/bar timing in text + a small fuel icon
- Recovery: meal + calories + macro bar

**Right Panel — "Mission Control" (60% width, full height ~480px):**
Dark card. At the very top: a race countdown chip — "**14 WEEKS TO PATAS RACE 2026**" in Barlow Condensed 18px orange, with a clock SVG icon on the left that has a sweeping second hand animation. The chip has a subtle orange border + pulsing glow every 3s.

Weekly Schedule grid below the chip:
Seven columns (Mon–Sun). Column header: 3-letter day in Bebas Neue muted small. Today's column: orange background tint `rgba(255,76,0,0.08)` + orange top border. Each day cell has a workout pill:
- **Rest day:** A gray pill with "REST" in Bebas Neue. A small hammock/zzz icon.
- **Easy ride:** Green pill, bike icon, "90 min Easy" text
- **Interval session:** Orange pill, lightning bolt icon, "60 min Intervals"
- **Tempo run:** Yellow pill, running figure icon, "45 min Tempo"
- **Race/Hard:** Red pill, flag icon, "Race Sim"
On hover over a workout pill: a tooltip card expands below it with: Target HR zone (shown as colored zone bands Z1–Z5), description text, target power/pace. The tooltip has a downward-pointing arrow and appears with a `scaleY` animation from `0` to `1`.
Below the grid: a small "🔄 Regenerate Plan" button (ghost style, small, with a spinning gear icon on hover).

**5B. Bottom Section — Weekly Mileage Graph (full width):**
A custom SVG/Canvas line chart. Design:
- Background: `#111318` dark card, full width
- Chart area: dark, no gridlines except very faint horizontal dashes in `rgba(255,255,255,0.04)`
- Primary line: orange `#FF4C00`, 2px stroke, with a gradient area fill below that fades from `rgba(255,76,0,0.3)` to `rgba(255,76,0,0)` at the bottom
- Secondary line: `#3ECFFF` dashed (weekly hours on secondary right Y-axis)
- Data points: 8px circles, orange fill. On hover: circle scales to 14px with an orange glow ring
- X-axis: months (Jan → Dec 2026) in Bebas Neue small muted, with week tick marks
- Y-axis left: km (0–200), Y-axis right: hours (0–20), both in JetBrains Mono small muted
- "This week" marker: vertical orange dashed line with a small "NOW" label at the top
- Hovering a data point: a stats panel animates in from the right side of the graph (slides in `translateX(20px)` to `0` + fade). The panel (dark card, orange top border) shows:
  - Week range (e.g., "May 18–24")
  - Total km, total hours, total elevation
  - Activities list: each activity as a clickable row — sport icon + title + distance. Clicking routes to that activity's detail page.

**Creative requirements:**
- The cyclist SVG in the Rider Pod is the hero element. It must be genuinely animated — not a static image. Each part (crank, wheel, legs) should move at physically correct relative rates.
- The 180° hover rotation of the cyclist should be smooth enough that you can watch the crank and wheels continue spinning during the rotation.
- The weekly schedule should look like a real race team's training week board — not a generic calendar widget.
- The graph's "hover panel" should feel like a race stage result card, not a generic tooltip.

---

## TASK 6 — Activities Page & Single Activity Page

**Context:** Import Design System (Task 0), Navbar + PaceBot (Task 4), CyclistLoader (Task 1). Routes: `/activities` and `/activities/:id`.

**What to build:**

**6A. Activities List Page (`/activities`):**

Header area:
- "YOUR STAGES" in Barlow Condensed 72px white. Behind it: a faint bicycle wheel SVG watermark (opacity 0.03, `position: absolute`, non-interactive). Sub-label "Every kilometer, every climb, every story." in DM Sans italic muted.
- Filter bar: Sport dropdown (All / Ride / Run, styled as gear-selector dropdowns), Date range picker (dark themed, orange range highlight), Distance range dual-handle slider (custom styled: orange track, orange handles shaped as tiny tire circles), text search input with magnifying glass + chain icon.
- Sort tabs: Date · Distance · Elevation · Duration — each with up/down arrows styled as chainring teeth icons.
- Activity count chip: "Showing 12 of 685 stages" in Bebas Neue orange.

Activity cards (list layout, full-width each):
Each card is a dark surface `#111318` card:
- On hover: card translates `translateX(6px)`, an orange left border `4px` appears with a sweep animation (height animates from 0% to 100% over 200ms)
- Left: 48px circle with sport icon inside — orange circle for Ride, green for Run
- Middle-left: Sport badge pill (small, rounded) + Activity title in Barlow Condensed 22px white (link → detail page) + Date in DM Sans small muted
- Middle-center: three stat chips inline — Distance + Time + Elevation, each with icon + JetBrains Mono value + Bebas Neue unit
- Right: a mini elevation profile — a custom SVG `<path>` that draws the mountain/hill silhouette of that ride's elevation (even if approximated). Dark background, orange fill below the line. 120×40px.
- Far right: Edit (pencil) + Share (link) icon buttons, ghost style, appear on hover

Pagination: "Load More Stages" button at bottom — orange ghost style. On click: CyclistLoader triggers, new cards append from below with staggered entrance (each new card fades+slides up with 50ms stagger).

**6B. Single Activity Page (`/activities/:id`):**

Hero banner (full width, 280px tall):
- Background: a static route map screenshot or a rendered colored map (use Leaflet.js or a static map tile). Dark gradient overlay `linear-gradient(to bottom, rgba(10,12,15,0.2), rgba(10,12,15,0.9))`.
- Overlaid: Activity title in Barlow Condensed 56px white. Below: date + location (city name) + sport badge pill.

Stats row (6 cards, full width):
Distance · Moving Time · Elevation · Avg Speed · Max Speed · Energy kJ — all dark cards, numbers count up from 0 on mount in JetBrains Mono, Bebas Neue labels.

Two-column main content (60/40 split):

Left column:
- Interactive Leaflet map (400px tall). Route as orange polyline. Green circle = start, 🏁 flag marker = finish. On map hover: a tooltip at cursor shows altitude at that point on the route.
- Below map: Elevation profile chart (using Recharts or D3). Area chart, orange fill with gradient fade. X-axis = km, Y-axis = altitude. Hover shows: altitude + gradient % + km marker. Steep sections (>8% gradient) highlighted with a deeper orange/red fill band.
- Split table: each km as a row, columns: km marker, time, speed, elevation change. Fastest km row has an orange background tint + ⚡ icon. Slowest km has a blue tint.

Right column:
- Performance Score dial: large circular SVG gauge (like a velodrome track overhead view — a circular track with the score position marked as a dot traveling around it). Score sweeps in on mount.
- Power/HR chart if data: dual-line Recharts chart. Zone bands (Z1=blue, Z2=green, Z3=yellow, Z4=orange, Z5=red) as horizontal `<ReferenceArea>` elements behind the lines.
- Segments section: collapsible accordion. Each row: segment name + distance + time + PR badge (if personal record: gold crown SVG with a scale-bounce entrance animation). Segment rows have hover highlight.
- At the bottom: Kudos row (orange 👍 icon + count, with a +1 float animation on click) + Comment input styled as a race radio text field with a 📡 icon.

**Creative requirements:**
- The elevation profile must feel like reading a race profile in a race bible — not just a chart. Use mountain/hill silhouette aesthetic.
- The split table's fastest km highlight should draw the eye immediately — it's the most important data point on the page.
- The PR badge in segments should feel like a real achievement moment with its bounce-in animation.

---

## TASK 7 — Best Efforts Page

**Context:** Import Design System (Task 0), Navbar + PaceBot (Task 4). Route: `/best-efforts`.

**What to build:**

Header:
"BEST EFFORTS" in Barlow Condensed 72px white with a podium SVG icon to the right (three-step podium, gold/silver/bronze steps). Sub-label: "Your fastest performances across all distances." A cycling trophy SVG watermark behind the heading (faint, decorative).

Distance Category Tabs:
A horizontal tab bar styled as a **gear cluster** — the tabs are arranged in a row and the active tab has a spinning gear icon. Tabs: 400m · 1 km · 5 km · 10 km · 20 km · 1hr Power (for rides) · Fastest Climb. Each tab: Bebas Neue label, dark pill. Active tab: orange fill, white text, gear icon spinning. Tab switching triggers a smooth content swap (`opacity` + `translateY` transition).

For each selected distance — Best Efforts Table:
Column headers: Rank · Activity Name · Date · Time/Speed · vs Best (delta). Header row dark, Bebas Neue small.
- Rank 1: gold left border `4px` + a subtle gold shimmer animation sliding left-to-right on the row
- Rank 2: silver left border
- Rank 3: bronze left border
- All other rows: standard dark card with orange hover
- "vs Best" column: if PR → `NEW PR 🏆` chip in gold. If within 1%: `↑ SO CLOSE` in orange. If regressed: delta in red with a `↓` arrow.
- On row hover: the row expands (height increases) to reveal a mini sparkline SVG showing the progression of that effort across all attempts over time (small, 200×32px, orange line).

PR Progression Chart (below table):
A full-width line chart for the selected distance. X-axis = dates, Y-axis = time (inverted: lower = better). When a PR was set: the data point is a gold star shape instead of a circle. On hover of a gold star: a mini celebration — a small SVG burst animation (rays extending from the point). Below the chart: a label "You've improved your [1km time] by [X seconds] since [date]" in DM Sans.

**Creative requirements:**
- The gold shimmer on rank 1 is the hero animation of this page — it must look genuinely metallic, not just yellow. Use a CSS `linear-gradient` sweep animation passing across the row.
- The gear-cluster tab selector is a signature element — each tab should be visually distinct in size (like a real cassette — smaller tabs on the right for shorter distances, larger on the left for longer efforts).
- The PR progression chart should feel like watching a race result get faster over time.

---

## TASK 8 — Training Calendar Page

**Context:** Import Design System (Task 0), Navbar + PaceBot (Task 4), CyclistLoader (Task 1). Route: `/calendar`.

**What to build:**

Header:
"TRAINING CALENDAR" in Barlow Condensed 72px. Sub-label with AI badge: a small pill "AI PLAN ACTIVE" with a pulsing green dot + Bebas Neue text in orange. A View toggle (segmented control): "📅 Calendar" / "📋 Log" — styled as handlebar positions (drops vs. aero).

**Log View:**
Replicates the Training Log from the Strava screenshots but heavily restyled:
- Background: `#0A0C0F`. Week rows separated by a full-width "road" divider — a dark strip with a dashed white centerline (like looking down a road) that spans the full width. The dashes use `border-top: 2px dashed rgba(255,255,255,0.15)`.
- Each row: week label left ("May 18–24" in Barlow Condensed white, "53.66 km" in JetBrains Mono orange below it as total). Seven day columns right (Mon–Sun headers in Bebas Neue).
- Activity bubbles: circles that scale with distance (small=0–20km, medium=20–60km, large=60km+). Color: orange for rides, green for runs. On hover: bubble gains orange glow ring + a tooltip card appears above (activity name, distance, time, elevation).
- Clicking a bubble: navigates to that activity's Single Activity Page with a page transition.
- AI-planned (not yet completed) activities: shown as dashed-border circles with the same color but 40% opacity. On hover: shows planned workout details. These show the AI's intended workout for that day.

**Calendar View:**
Full monthly grid (7 columns × 5-6 rows). Cell design:
- Day number: Bebas Neue small, top-left of cell.
- Planned workout pill (AI): dashed orange border, small pill with sport icon + duration
- Completed workout pill: solid fill, same color as list view bubbles, sport icon + distance
- If completed matches planned: a small ✓ green checkmark appears
- If missed (planned but not completed, past date): red border on the day cell
- Today's cell: orange background tint `rgba(255,76,0,0.08)` + orange border
- On clicking a day: a drawer slides in from the right (`translateX(100%)` to `0`). The drawer shows: planned workout full details (AI coach note for the day: "Today's goal: 2hrs endurance at Z2. Keep HR below 145bpm..."), actual completed workout (if exists), and a comparison between the two.

Right Sidebar (collapsible, fixed right, 240px):
- Week stats: TSS (Training Stress Score as a gauge), weekly km, weekly hours, weekly elevation
- A three-line chart for fitness/fatigue/form (CTL=blue, ATL=orange, TSB=green). Small, 200×80px chart. X-axis = weeks. A tooltip on hover shows values. Legend below: "Fitness / Fatigue / Form"
- Toggle sidebar: a `>` arrow button on its left edge. Slides out with spring animation.

**Creative requirements:**
- The "road divider" between weeks in Log View is the defining visual — it should genuinely look like an asphalt road with a centerline, even if stylized.
- The calendar grid missed-day red border should feel like a warning light on a bike computer — urgent but not alarming.
- The CTL/ATL/TSB sidebar chart is a hallmark of serious cycling training tools — label it properly and make it readable even at small size.

---

## TASK 9 — AI Training Page

**Context:** Import Design System (Task 0), Navbar + PaceBot (Task 4), CyclistLoader (Task 1). Route: `/ai-training`.

**What to build:**

Header:
"AI TRAINING COMMAND" in Barlow Condensed 72px. After "COMMAND": a blinking orange cursor `|` animation (CSS `@keyframes blink`). Below: "Your AI coach is analyzing your data..." with a typewriter animation (characters appear one by one, 60ms per character, then loops).

**Schedule Race Button:**
A large, prominent button — full-width or centered, `56px` tall. Orange with parallelogram clip-path. Icon: `+` SVG. Text: "SCHEDULE RACE TARGET" in Barlow Condensed 22px white. The button has a pulsing animation: 3 concentric rings expand outward from the button every 3s (like a radar ping — `@keyframes racePing` using `transform: scale()` + `opacity: 0` at the end). This gives a "race control calling you" feel.

**Schedule Race Modal:**
Opens as a full-screen overlay (dark frosted glass `backdrop-filter: blur(16px)`, `rgba(10,12,15,0.9)` background). The modal content is styled as a race entry form / race bib — it has a decorative header that looks like a race bib number plate (orange border rectangle, race number "001" top-right, "CYCLOAI RACE REGISTRATION" as header text in Bebas Neue).

Form fields (all dark styled, orange focus glow):
1. Race Name — text input, label: "RACE NAME" in Bebas Neue small orange
2. Race Type — segmented button group: Road Race · Time Trial · Criterium · Gran Fondo · Gravel. Each option has a small SVG icon. Active: orange fill.
3. Race Date — custom date picker (dark-themed calendar dropdown, today highlighted in orange)
4. Location — text input with map pin icon
5. Distance — horizontal slider 10km–300km + numeric input. Slider track orange.
6. Elevation Gain — horizontal slider 0m–5000m + numeric input
7. Race Priority — three large pills: **A-Race** (gold, "My peak event"), **B-Race** (silver, "Secondary goal"), **C-Race** (bronze, "Participation"). Selected pill glows.
8. Expected Conditions — dropdown: Hot / Cold / Wet / Mixed / Unknown
9. Course Description — dark textarea, "Describe key climbs, technical sections, road surface..."
10. Personal Goal — text input, "What's your target? (podium, finish, PB...)"

Submit button: "🔒 LOCK IN TARGET" in Barlow Condensed. On click: lock SVG animates closing (from unlocked to locked), then CyclistLoader.

**Upcoming Races Table:**
Dark card, full width. Header row in Bebas Neue small. Columns:
- Race Name (Barlow Condensed 18px, clickable to expand)
- Race Type (pill badge: Road=orange, TT=blue, Crit=yellow, GF=green, Gravel=brown)
- Location (with 📍 icon)
- Distance (JetBrains Mono + "km" in Bebas Neue small)
- Date + countdown ("14 weeks" in orange below the date)
- Description (truncated 40 chars + "..." — hover tooltip or click to expand shows full text)
- Nutrition Plan status:
  - `> 2 weeks away`: 🔒 gray lock icon + "Available [date]" in muted text
  - `≤ 2 weeks away`: orange "VIEW PLAN 🍌" button
- Priority badge: A/B/C in gold/silver/bronze styled badges
- Actions: ✏️ Edit (opens modal pre-filled) · 🗑️ Delete (red, confirm dialog)

Table rows have hover highlight + a subtle left-side color accent matching their priority badge. Clicking a row name expands an accordion below with full description + AI coach notes.

**Nutrition Plan Side Drawer:**
Triggered by "View Plan" button. Slides in from the right (full height, 360px wide). Sections:
- **Pre-Race** (night before + morning of): meals with calorie counts + macro bars
- **On-Bike Timeline**: a horizontal `distance → fuel` timeline. Orange line with fuel icons (🍌 gel, 🏪 bar, 💧 bottle) at distance markers. E.g.: 0km start → 45km first gel → 90km bar + gel → etc. On hover each fuel icon: tooltip with product name + calories + timing note.
- **Hydration**: ml/hr recommendation based on race conditions
- **Post-Race Recovery**: meal + supplements

**AI Periodization Section (below table):**
A "coach's letter" card — dark card with a very subtle noise texture `background-image`. Header: "📋 YOUR RACE SEASON PLAN" in Bebas Neue orange. Content: AI-generated text in DM Sans 15px body, using a typewriter animation (reveals on scroll into view). Below the text: a horizontal periodization timeline bar chart — training blocks shown as colored rectangles:
- Base (gray-blue) · Build (yellow) · Peak (orange) · Taper (red) · Race (checkered flag pattern)
Each block has a label + week count. The current week has a vertical orange "YOU ARE HERE" marker.

**Creative requirements:**
- The radar-ping animation on the "Schedule Race" button is a signature element — it should feel like mission control calling for a race briefing.
- The nutrition plan distance timeline is the most technically interesting element — each fuel icon should appear at the correct proportional distance along the bar.
- The race bib styling on the modal header must be unmistakable — think actual race bib aesthetics (bold numbers, safety pin icons, sponsor-style layout).

---

## TASK 10 — Race Results Page

**Context:** Import Design System (Task 0), Navbar + PaceBot (Task 4), CyclistLoader (Task 1). Route: `/race-results`.

**What to build:**

Header:
"RACE HISTORY" in Barlow Condensed 72px. To the right of the heading: a checkered flag SVG that animates — the flag waves using a CSS `@keyframes` that creates a ripple effect across the flag's grid squares (each square flips from white to black alternately in a wave pattern). Sub-label: "Every finish line you've crossed." in DM Sans italic muted.

Season Summary Strip (full width below header):
A horizontal strip, dark orange-tinted background `rgba(255,76,0,0.08)` with `1px` orange border. Five stats inline: Total Races · Best Finish · Total Race km · Total Race Elevation · Podiums (count). Numbers in JetBrains Mono orange, labels in Bebas Neue small muted.

Race History Cards:
Each completed race is a full-width card. On hover: the card's background very subtly reveals a faint route map of that race (using `opacity: 0` to `opacity: 0.05` on a map image positioned as `background-image`). Card layout:

- Left (60%):
  - Race name in Barlow Condensed 32px white
  - Race type badge pill + Location (📍 icon) + Date — all in DM Sans small
  - Stats row: Distance · Elevation · Official Time · Avg Power — icon + JetBrains Mono value
  - Experience / Race Story: a quote-block styled section. The rider's written race story in DM Sans 14px italic. A subtle left orange border (2px) marks it as a quote. A small ✏️ Edit Story button appears on hover.

- Right (40%):
  - A race number plate — a styled rectangle with: orange/yellow border, "CYCLOAI" small at top, the **finishing position number** large in Barlow Condensed 64px white center, below it "of [total] riders" in DM Sans small muted. The plate has corner bolt icons (decorative SVG bolts in the four corners, like a real race plate).
  - If podium (top 3): the number plate gets a metallic shimmer overlay animation + a small 🏆/🥈/🥉 icon top-left of the plate.
  - A small "XP EARNED" pill below the plate in gold — showing experience points gained from this race.

Add Race Result Button:
A large `+` floating button (56px, orange, fixed bottom-center). On click: a modal opens with fields: Race Name, Type, Date, Location, Distance, Elevation, Finishing Time, Finishing Position, Total Field Size, Race Experience (large textarea with "Tell the story of your race..."). Submit: "SUBMIT RESULT" in Barlow Condensed.

Race Badges Section (below all cards):
A full-width section: "RACE BADGES" header in Bebas Neue. A grid of badge icons earned from race history: First Race Completed · First Podium · Century Racer (100km+ race) · Mountain Conqueror (3000m+ elevation race) · Multi-Sport · Speed Demon (top 10% finishing time) · Veteran (10+ races). Each badge is a hexagonal icon (cycling uses hexagons, as in honeycomb, referencing the efficiency of nature). Locked badges are shown as outlines. New unlocks animate with a `scale(0)` → `scale(1.2)` → `scale(1)` bounce.

**Creative requirements:**
- The checkered flag animation in the header is a showstopper — it must look like a real waving flag, not just a static image. Use CSS grid + `@keyframes` to animate individual cells.
- The race number plate on the right is the identity element of this page — it should look exactly like a real bicycle race bib plate (rectangular, bold numbers, corner bolts, colored border).
- The podium metallic shimmer for top-3 finishes should feel like a medal ceremony moment.

---

## TASK 11 — Statistics Page

**Context:** Import Design System (Task 0), Navbar + PaceBot (Task 4). Route: `/statistics`.

**What to build:**

Header:
"YOUR NUMBERS" in Barlow Condensed 72px. To the right: a real-time ticker showing total lifetime km, incrementing live at a rate representing average km/hour (e.g., if avg is 15km/hr training, the counter ticks +0.0042 km every second). In JetBrains Mono orange, with a small "km" in Bebas Neue.

Top Stats Tiles (6, full width):
- Total Lifetime km
- Total Elevation ("You've climbed 3.2 Everests" — calculate Everest = 8,849m, show the Everest equivalent)
- Total Moving Hours
- Longest Single Ride (km)
- Fastest Recorded km (pace in JetBrains Mono)
- Total Calories Burned

Each tile: dark card, large JetBrains Mono number, Bebas Neue label, a small decorative cycling icon relevant to the stat (mountain for elevation, clock for hours, lightning for fastest, etc.).

Charts Grid (2×2):

1. **Monthly Distance Bar Chart**: 12 months. Orange bars. Current month: glowing orange bar with a pulsing glow. Previous months: slightly muted. Hover bar: tooltip with that month's breakdown (rides vs runs, total hours). Bar chart rendered with Recharts `<BarChart>`.

2. **Sport Distribution "Wheel Chart"**: Instead of a generic pie chart, render it as a **bicycle wheel** SVG — the center hub is white, and each sport occupies a "segment" of the wheel like tire sections. Ride = orange segment, Run = green, etc. The wheel spins once on mount (`@keyframes wheelSpin` 1 full rotation over 1.5s ease-out). Hover segment: expands slightly outward with its label.

3. **Monthly Elevation Line Chart**: Recharts `<AreaChart>`. Blue `#3ECFFF` line. A mountain silhouette SVG is placed decoratively behind the chart (faint, low opacity). Each data point: on hover shows month + total elevation.

4. **Performance Score Trend**: Recharts `<AreaChart>`. Orange-to-red gradient fill. X-axis = weeks, Y-axis = 0–100 score. A horizontal reference line at 70 labeled "Good Form Zone" in Bebas Neue small. The area below 50 has a red tint.

Heatmap Calendar:
Full-year calendar styled as an **oval cycling track** layout — the months curve around an oval, like a velodrome track overhead view. Each day is a cell colored by intensity: gray = rest, light orange = easy, medium orange = moderate, dark orange = hard/race. Hover any cell: tooltip with date + activity name + distance.

Personal Records Table:
Tabs by distance (similar to Best Efforts page). For each PR: all-time record, date set, improvement trend sparkline.

**Creative requirements:**
- The "You've climbed X Everests" stat is the most shareable element on this page — make it visually prominent with a tiny mountain range SVG illustration next to it.
- The sport distribution wheel chart must genuinely look like a bicycle wheel — spokes, hub, rim, and all.
- The live-ticking lifetime km counter in the header is the "wow" element that tells visitors this is a real, living platform.

---

## SEQUENCE SUMMARY

| # | Task | Depends On | Route |
|---|------|-----------|-------|
| 0 | Design Tokens | — | (globals) |
| 1 | Foundation: Loader, Cursor, Toast, Page Transition | 0 | (shared) |
| 2 | Landing Page | 0, 1 | `/` |
| 3 | Login & Signup | 0, 1 | `/login`, `/signup` |
| 4 | Navbar & PaceBot | 0, 1 | (shared, post-login) |
| 5 | Dashboard | 0, 1, 4 | `/dashboard` |
| 6 | Activities List + Single Activity | 0, 1, 4 | `/activities`, `/activities/:id` |
| 7 | Best Efforts | 0, 1, 4 | `/best-efforts` |
| 8 | Training Calendar | 0, 1, 4 | `/calendar` |
| 9 | AI Training | 0, 1, 4 | `/ai-training` |
| 10 | Race Results | 0, 1, 4 | `/race-results` |
| 11 | Statistics | 0, 1, 4 | `/statistics` |

**Tech Stack recommended for all tasks:**
React 18 + Vite, Tailwind CSS v3, Recharts (charts), Leaflet.js (maps), Framer Motion (complex animations), React Router v6, Lucide React (icons).
