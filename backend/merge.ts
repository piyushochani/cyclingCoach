import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cyclogenai';

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
  profileImage: String,
  description: String,
  coaches: { type: [mongoose.Schema.Types.Mixed], default: [] },
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
  time: { type: String, default: '' },
  position: { type: Number, default: null },
  number: { type: Number, default: null },
  totalRiders: { type: Number, default: null },
  story: { type: String, default: '' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const planSchema = new mongoose.Schema({
  name: String,
  content: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const expenseSchema = new mongoose.Schema({
  date: Date,
  itemName: String,
  quantity: { type: Number, default: 1 },
  cost: Number,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

async function merge() {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const UserModel = mongoose.model('User', userSchema);
  const ActivityModel = mongoose.model('Activity', activitySchema);
  const RaceModel = mongoose.model('Race', raceSchema);
  const PlanModel = mongoose.model('TrainingPlan', planSchema);
  const ExpenseModel = mongoose.model('Expense', expenseSchema);

  const TARGET_EMAIL = 'piyushochani0@gmail.com';

  // Find or create target user
  let targetUser = await UserModel.findOne({ email: TARGET_EMAIL });
  if (!targetUser) {
    console.log(`Target user ${TARGET_EMAIL} not found. Creating...`);
    const hash = await bcrypt.hash('password123', 12);
    targetUser = await UserModel.create({
      firstName: 'Piyush',
      lastName: 'Ochani',
      email: TARGET_EMAIL,
      passwordHash: hash,
      mainSport: 'cycling',
      experienceLevel: 'intermediate',
    });
    console.log(`Created target user: ${targetUser._id}`);
  } else {
    console.log(`Found target user: ${targetUser._id} (${targetUser.firstName} ${targetUser.lastName})`);
  }

  // Find all other users
  const otherUsers = await UserModel.find({ email: { $ne: TARGET_EMAIL } });
  console.log(`Found ${otherUsers.length} other user(s) to merge from:`);
  for (const u of otherUsers) {
    console.log(`  - ${u.email} (${u._id})`);
  }

  if (otherUsers.length === 0) {
    console.log('No other users found. Nothing to merge.');
    await mongoose.disconnect();
    return;
  }

  const otherUserIds = otherUsers.map(u => u._id);

  // Reassign Activities
  const activityResult = await ActivityModel.updateMany(
    { user: { $in: otherUserIds } },
    { $set: { user: targetUser._id } }
  );
  console.log(`Activities reassigned: ${activityResult.modifiedCount}`);

  // Reassign Races
  const raceResult = await RaceModel.updateMany(
    { user: { $in: otherUserIds } },
    { $set: { user: targetUser._id } }
  );
  console.log(`Races reassigned: ${raceResult.modifiedCount}`);

  // Reassign TrainingPlans
  const planResult = await PlanModel.updateMany(
    { user: { $in: otherUserIds } },
    { $set: { user: targetUser._id } }
  );
  console.log(`TrainingPlans reassigned: ${planResult.modifiedCount}`);

  // Reassign Expenses
  const expenseResult = await ExpenseModel.updateMany(
    { user: { $in: otherUserIds } },
    { $set: { user: targetUser._id } }
  );
  console.log(`Expenses reassigned: ${expenseResult.modifiedCount}`);

  // Delete the old users
  const deleteResult = await UserModel.deleteMany({ email: { $ne: TARGET_EMAIL } });
  console.log(`Deleted ${deleteResult.deletedCount} old user(s)`);

  // Show final counts
  const totalActivities = await ActivityModel.countDocuments();
  const totalRaces = await RaceModel.countDocuments();
  const totalPlans = await PlanModel.countDocuments();
  const totalExpenses = await ExpenseModel.countDocuments();
  console.log('\nFinal data counts under target user:');
  console.log(`  Activities: ${totalActivities}`);
  console.log(`  Races: ${totalRaces}`);
  console.log(`  TrainingPlans: ${totalPlans}`);
  console.log(`  Expenses: ${totalExpenses}`);

  await mongoose.disconnect();
  console.log('\nMerge complete!');
}

merge().catch((err) => {
  console.error('Merge failed:', err);
  process.exit(1);
});
