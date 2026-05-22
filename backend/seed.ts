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
  const RaceModel = mongoose.model('Race', raceSchema);
  const PlanModel = mongoose.model('TrainingPlan', planSchema);

  await Promise.all([
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
