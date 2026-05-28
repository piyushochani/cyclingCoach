import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cycloai';

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  passwordHash: String,
  mainSport: { type: String, default: 'cycling' },
  experienceLevel: { type: String, default: 'intermediate' },
  heightCm: Number,
  weightKg: Number,
  goal: String,
  cyclingYears: Number,
  ftp: Number,
});

const activitySchema = new mongoose.Schema({
  name: String,
  sport: String,
  distance: Number,
  durationSeconds: Number,
  elevationGain: Number,
  date: Date,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const raceSchema = new mongoose.Schema({
  name: String,
  type: String,
  date: Date,
  location: String,
  distance: Number,
  elevationGain: Number,
  priority: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const planSchema = new mongoose.Schema({
  name: String,
  content: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

async function seed() {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const UserModel = mongoose.model('User', userSchema);
  const ActivityModel = mongoose.model('Activity', activitySchema);
  const RaceModel = mongoose.model('Race', raceSchema);
  const PlanModel = mongoose.model('TrainingPlan', planSchema);

  await Promise.all([
    ActivityModel.deleteMany({}),
    RaceModel.deleteMany({}),
    PlanModel.deleteMany({}),
  ]);
  await UserModel.deleteMany({});
  console.log('Cleared existing data');

  const user = await UserModel.create({
    firstName: 'Piyush',
    lastName: 'Ochani',
    email: 'piyush@example.com',
    passwordHash: 'dummyhash',
    mainSport: 'cycling',
    experienceLevel: 'intermediate',
  });
  console.log('Created user:', user._id);

  const now = new Date();
  const activities = [
    { name: 'Morning Ride', sport: 'cycling', distance: 45.2, durationSeconds: 5400, elevationGain: 320, date: new Date(now.getTime() - 86400000 * 0), user: user._id },
    { name: 'Hill Climb', sport: 'cycling', distance: 32.1, durationSeconds: 4200, elevationGain: 580, date: new Date(now.getTime() - 86400000 * 1), user: user._id },
    { name: 'Recovery Run', sport: 'running', distance: 8.5, durationSeconds: 2700, elevationGain: 45, date: new Date(now.getTime() - 86400000 * 2), user: user._id },
    { name: 'Evening Ride', sport: 'cycling', distance: 55.0, durationSeconds: 6600, elevationGain: 410, date: new Date(now.getTime() - 86400000 * 3), user: user._id },
    { name: 'Gym Session', sport: 'workout', distance: 0, durationSeconds: 3600, elevationGain: 0, date: new Date(now.getTime() - 86400000 * 4), user: user._id },
    { name: 'Long Weekend Ride', sport: 'cycling', distance: 92.3, durationSeconds: 10800, elevationGain: 720, date: new Date(now.getTime() - 86400000 * 5), user: user._id },
    { name: 'Trail Run', sport: 'running', distance: 12.0, durationSeconds: 3900, elevationGain: 180, date: new Date(now.getTime() - 86400000 * 6), user: user._id },
    { name: 'Commute Ride', sport: 'cycling', distance: 22.8, durationSeconds: 3000, elevationGain: 150, date: new Date(now.getTime() - 86400000 * 7), user: user._id },
    { name: 'Hike', sport: 'hiking', distance: 10.5, durationSeconds: 5400, elevationGain: 450, date: new Date(now.getTime() - 86400000 * 9), user: user._id },
    { name: 'Interval Training', sport: 'cycling', distance: 38.6, durationSeconds: 4800, elevationGain: 290, date: new Date(now.getTime() - 86400000 * 11), user: user._id },
    { name: 'Easy Run', sport: 'running', distance: 6.0, durationSeconds: 2100, elevationGain: 30, date: new Date(now.getTime() - 86400000 * 12), user: user._id },
    { name: 'Group Ride', sport: 'cycling', distance: 68.4, durationSeconds: 7800, elevationGain: 510, date: new Date(now.getTime() - 86400000 * 14), user: user._id },
    { name: 'Strength Training', sport: 'workout', distance: 0, durationSeconds: 2700, elevationGain: 0, date: new Date(now.getTime() - 86400000 * 16), user: user._id },
    { name: 'Zwift Session', sport: 'cycling', distance: 40.0, durationSeconds: 5100, elevationGain: 200, date: new Date(now.getTime() - 86400000 * 18), user: user._id },
    { name: 'Recovery Walk', sport: 'hiking', distance: 5.2, durationSeconds: 2400, elevationGain: 60, date: new Date(now.getTime() - 86400000 * 20), user: user._id },
    { name: 'Time Trial', sport: 'cycling', distance: 25.0, durationSeconds: 3000, elevationGain: 180, date: new Date(now.getTime() - 86400000 * 22), user: user._id },
    { name: 'Weekend Trail Run', sport: 'running', distance: 15.0, durationSeconds: 4500, elevationGain: 220, date: new Date(now.getTime() - 86400000 * 25), user: user._id },
    { name: 'Endurance Ride', sport: 'cycling', distance: 110.0, durationSeconds: 14400, elevationGain: 890, date: new Date(now.getTime() - 86400000 * 28), user: user._id },
    { name: 'Morning Run', sport: 'running', distance: 10.0, durationSeconds: 3000, elevationGain: 80, date: new Date(now.getTime() - 86400000 * 30), user: user._id },
    { name: 'Hill Repeats', sport: 'cycling', distance: 35.0, durationSeconds: 4800, elevationGain: 650, date: new Date(now.getTime() - 86400000 * 35), user: user._id },
  ];

  await ActivityModel.insertMany(activities);
  console.log(`Created ${activities.length} activities`);

  const races = [
    { name: 'Tour de Valley', type: 'road', date: new Date('2026-04-15'), location: 'Mountain Valley', distance: 160, elevationGain: 1200, priority: 'A', user: user._id },
    { name: 'City Criterium', type: 'criterium', date: new Date('2026-05-20'), location: 'Downtown', distance: 80, elevationGain: 200, priority: 'B', user: user._id },
    { name: 'Gran Fondo Hills', type: 'gran fondo', date: new Date('2026-06-10'), location: 'Hill Country', distance: 200, elevationGain: 2500, priority: 'A', user: user._id },
    { name: 'Charity Ride', type: 'social', date: new Date('2026-07-04'), location: 'Riverside', distance: 100, elevationGain: 500, priority: 'C', user: user._id },
  ];

  await RaceModel.insertMany(races);
  console.log(`Created ${races.length} races`);

  const plans = [
    { name: 'Base Building Phase', content: 'Zone 2 endurance rides 4x/week, strength training 2x/week', user: user._id },
    { name: 'Race Prep', content: 'Interval sessions 3x/week, long rides on weekends, recovery runs', user: user._id },
    { name: 'Recovery Week', content: 'Easy spins 3x/week, stretching, mobility work', user: user._id },
  ];

  await PlanModel.insertMany(plans);
  console.log(`Created ${plans.length} plans`);

  await mongoose.disconnect();
  console.log('Seed complete');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
