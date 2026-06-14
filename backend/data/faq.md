# CyclogenAI FAQ

## Getting Started

### How do I create an account?
Visit the signup page and enter your name, email, and password. After signing up, you'll be prompted to complete your onboarding — set your cycling experience, goals, FTP, weight, and other profile details. You can also connect Strava during onboarding.

### How do I log in?
Go to the login page and enter your email and password. If you used Google OAuth during signup, use the Google sign-in button instead.

### I forgot my password. What do I do?
Click "Forgot Password" on the login page. Enter your email and you'll receive a reset link. Click the link in the email to set a new password. After resetting, you'll be automatically logged in and redirected to the dashboard.

### How do I set up my profile after signing up?
Go to Settings > Profile. You can update your name, FTP, weight, height, max heart rate, age, and cycling experience. Your FTP is especially important for accurate zone calculations and training plan recommendations.

### What is FTP and why does it matter?
FTP (Functional Threshold Power) is the highest power you can sustain for approximately one hour. It's the cornerstone of power-based training. All your power zones, workout intensities, and training load calculations are based on your FTP. Keep it updated as you get fitter.

## Dashboard & Navigation

### Where is the dashboard?
The dashboard is the first page you see after logging in. It shows your weekly summary, recent activities, heatmap, training readiness, and quick stats. You can access it anytime by clicking the logo or "Dashboard" in the sidebar.

### How do I navigate the app?
Use the sidebar on the left. The main sections are: Dashboard, Activities, Calendar, Training, Gear, Strava settings, and Account settings. On mobile, the sidebar collapses into a hamburger menu.

### What does each sidebar item do?
- Dashboard: Your home screen with weekly stats, recent rides, heatmap, goal progress
- Activities: Full list of all your rides with search, filter, and detail views
- Calendar: Monthly view of your activities and planned workouts
- Training: Weekly training plan, AI coaching, and performance analysis
- Gear: Manage your bikes and equipment
- Strava: Connect/disconnect Strava, manage sync settings
- Settings: Profile, password, notifications, preferences

### Where do I see my weekly statistics?
The weekly statistics graph and summary are on the Dashboard. It shows performed activities vs planned workouts for the current and past weeks. You can zoom in/out to see more weeks.

### What does the heatmap show?
The heatmap on the dashboard shows all your activities as colored lines on a map. Warmer colors (orange/red) indicate higher intensity. Click any activity line to view its details.

## Strava Integration

### How do I connect Strava?
Go to Settings > Strava and click "Connect Strava." You'll be redirected to Strava's authorization page. Approve the requested permissions, and you'll be redirected back. Your activities will sync automatically.

### What data does CyclogenAI sync from Strava?
We sync all cycling activities (rides, virtual rides, e-bike rides) including distance, duration, elevation, power data, heart rate, cadence, speed, temperature, and route/stream data. Non-cycling activities are not synced.

### How often does auto-sync run?
Auto-sync checks for new activities every 30 minutes by default. You can adjust this in Settings > Strava or manually trigger a sync anytime.

### How do I manually sync?
In Settings > Strava, click "Sync Now" to pull the latest activities. You can also ask the chatbot: "Sync my Strava" or "Run a sync."

### How do I disconnect Strava?
In Settings > Strava, click "Disconnect Strava." This revokes CyclogenAI's access to your Strava account. Your existing data remains in CyclogenAI but no new activities will sync.

### Why is my sync stuck or failing?
Common causes: Strava API rate limits (429 errors), expired tokens, or network issues. Try the following:
1. Go to Settings > Strava and check the sync status
2. Click "Sync Now" to retry
3. If the token is expired, disconnect and reconnect Strava
4. Wait a few minutes — Strava rate limits reset hourly
5. Contact support if the issue persists

### How do I check sync status?
Ask the chatbot "What's my sync status?" or go to Settings > Strava. The status shows when your last sync was, whether you're up to date, and any rate limit issues.

### What is Strava rate limiting?
Strava limits API requests to 100 requests every 15 minutes and 1000 requests per day. If you have many activities, a full sync may take several rounds. The system handles this automatically and resumes when the limit resets.

## Training Plans

### How do I generate a training plan?
You can generate a plan in two ways:
1. On the Training page, click "Generate Plan" or use the AI planning tool
2. Ask the chatbot: "Generate a training plan for this week" or "Plan my week"
The AI will consider your fitness level, recent training load, goals, and available time.

### What types of workouts can the AI create?
The AI can create: Endurance rides, Tempo workouts, Sweet Spot sessions, Threshold intervals, VO2max intervals, Sprint workouts, Recovery rides, and Pre-race taper blocks. Each workout includes duration, intensity zones, and structure.

### How do I view my current weekly plan?
Ask the chatbot "What's my plan for this week?" or go to the Training page. The plan shows each day's workout type, duration, and intensity.

### Can I modify a generated plan?
Yes. You can tell the chatbot "Change Wednesday's workout to endurance" or "Make Saturday's ride 3 hours instead of 2." You can also manually edit the plan on the Training page.

### How does the AI determine my training load?
The AI uses your recent activity history (last 3-4 weeks), CTL (Chronic Training Load), ATL (Acute Training Load), and TSB (Training Stress Balance). It adjusts intensity and volume to avoid overtraining while ensuring progressive overload.

### What is progressive overload?
Progressive overload means gradually increasing training stress (volume, intensity, or frequency) over time to drive fitness gains. The AI plans typically increase load by 5-10% per week, with recovery weeks every 3-4 weeks.

### How do I set a weekly distance goal?
Click "Set Weekly Goal" on the Dashboard's weekly statistics section, or ask the chatbot "Set my weekly goal to 150km." The goal is saved in your browser and reset manually.

## Activities

### Where can I see all my activities?
Go to the Activities page from the sidebar. It shows a sortable, filterable list of all your rides. You can search by name, filter by date range, or sort by distance, duration, or date.

### How do I view activity details?
Click any activity in the list or on the heatmap. The detail page shows: map with route, power/heartrate/cadence graphs, splits, elevation profile, weather, gear used, and AI analysis.

### What is AI activity analysis?
For each activity, the AI generates an analysis covering: workout type classification, performance metrics, fatigue patterns, pacing assessment, and recommendations for future training. Look for the analysis section on the activity detail page.

### How do I find a specific activity?
Use the search bar on the Activities page. You can search by name, or use the date filters to narrow down. You can also ask the chatbot "Find my ride from last Tuesday."

### Can I delete an activity?
Currently, activities synced from Strava cannot be deleted from CyclogenAI. They are removed automatically if deleted on Strava after the next sync.

## Gear Management

### How do I add a bike?
Go to Gear from the sidebar and click "Add Bike." Enter the bike name (e.g., "Trek Emonda") and optionally set it as active. Bikes synced from Strava appear automatically.

### How do I set a bike as active?
On the Gear page, click the "Set Active" button on the bike you want. The active bike is used for distance tracking and appears on activity detail pages. You can also ask the chatbot "Set my active bike to [name]."

### How do I add other equipment?
On the Gear page, switch to the "Equipment" tab and click "Add Equipment." Enter the name and type (e.g., "Garmin 530" — Computer). Equipment is for your reference and tracking.

### My Strava bikes don't appear in CyclogenAI
Run a manual sync from Settings > Strava. Bikes are synced from Strava during the sync process. If they still don't appear, try disconnecting and reconnecting Strava.

### How is gear distance tracked?
When you complete a ride with a Strava bike, the distance is automatically added to that bike's total. You can see total distance per bike on the Gear page.

## Chatbot (PaceBot)

### How do I open the chatbot?
Click the orange circular button at the bottom-right corner of any page. It has a chat icon.

### What can I ask the chatbot?
You can ask about:
- Your training: "How was my last ride?", "What's my plan this week?"
- Generating plans: "Plan my week", "Create a workout for tomorrow"
- Zones: "What are my power zones?", "Calculate zones from 280 FTP"
- Strava: "Sync my Strava", "What's my sync status?", "Connect Strava"
- Gear: "List my bikes", "Add a bike called Canyon Aeroad", "Set active bike"
- General help: "How do I connect Strava?", "Where is the settings page?", "How do I generate a training plan?"
- Activity analysis: "Analyze my ride from yesterday", "How was my weekend ride?"

### What commands does the chatbot support?
The chatbot understands natural language. Some common command examples:
- "/week" — Opens the weekly training plan
- "Sync Strava" — Triggers a manual sync
- "My power zones" — Shows your FTP-based zones
- "Set my weekly goal to 200km"
- "Add a bike called [name]"
- "List all my bikes"

### Why is the chatbot giving short answers?
The chatbot is designed to be concise. It answers directly without greetings or padding. If you need more detail, ask a follow-up question like "Tell me more about that" or "Give me the full analysis."

### Can the chatbot remember previous conversations?
Yes. The chatbot remembers the context of your current conversation (last ~30 messages). It also has access to your training history, fitness profile, and any notes the AI coach has saved about you.

## Account Settings

### How do I change my password?
Go to Settings > Account > Change Password. Enter your current password and the new password. The change-password page uses the orange theme matching the rest of the app.

### How do I update my fitness profile?
Go to Settings > Profile. You can update: FTP, weight, height, max heart rate, age, cycling experience, and training goals. These values are used by the AI coach for plan generation and analysis.

### How do I change my notification preferences?
Go to Settings > Notifications. You can enable/disable email notifications for: new activity analysis, weekly training plan ready, sync completed, and account updates.

### Can I delete my account?
Account deletion is not currently available from the app. Contact support if you need your account removed.

## Troubleshooting

### The app shows old data or activities are missing
Try these steps in order:
1. Go to Settings > Strava and click "Sync Now"
2. Check that Strava is connected (reconnect if needed)
3. Check that the activities are cycling activities (other sports are not synced)
4. Wait for the sync to complete (large syncs may take time due to rate limits)

### The activity detail page won't open
If clicking an activity shows a blank page or error:
1. Refresh the page
2. Try opening from a different location (heatmap vs. activity list)
3. Clear your browser cache and reload
4. If the URL shows "undefined" in the path, report this as a bug

### The weekly graph shows no data
If the weekly statistics graph is empty:
1. Ensure you have synced activities for the current week
2. Try changing the zoom level
3. Check that your training start date is set correctly in Settings
4. The graph requires at least one activity to show

### The onboarding screen keeps showing
This can happen if your browser clears localStorage. To prevent this:
1. Complete onboarding fully (all steps)
2. The system now checks multiple sources (localStorage, backend, database)
3. If it still shows, contact support

### The chatbot is not responding
If the chatbot doesn't reply:
1. Check your internet connection
2. Refresh the page and try again
3. The backend may be starting up — wait a moment
4. If using a VPN, try disabling it
5. Contact support if the issue persists

### I see "401 Unauthorized" errors
This usually means your session expired. Log out and log back in. If the issue continues, clear your browser cache and cookies.

### The forgot password email didn't arrive
1. Check your spam/junk folder
2. Ensure you entered the correct email address
3. Wait a few minutes — email delivery can be delayed
4. Contact support if you still don't receive it

### How do I report a bug or get help?
For bugs and support requests, report the issue at the project repository or contact the development team through the support channel.

### What browsers are supported?
CyclogenAI supports the latest versions of Chrome, Firefox, Safari, and Edge. Internet Explorer is not supported.

### Is there a mobile app?
CyclogenAI is a web application that works on mobile browsers. There is no native mobile app currently.
