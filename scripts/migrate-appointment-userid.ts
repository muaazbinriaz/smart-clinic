/**
 * One-time migration: backfill `userId` on existing Appointment documents
 * by matching phone (preferred) or exact name against the User collection.
 *
 * Run once after deploying the updated Appointment model:
 *   npx tsx scripts/migrate-appointment-userid.ts
 *
 * Safe to re-run — it only touches appointments where userId is still null.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

// IMPORTANT: these are dynamic imports, loaded AFTER dotenv.config() runs.
// Static `import` statements get hoisted above this file's code by the
// module loader, so dbConnect would otherwise read process.env.MONGODB_URI
// before it was ever set.
async function run() {
  const mongoose = (await import("mongoose")).default;
  const dbConnect = (await import("../lib/dbConnect")).default;
  const Appointment = (await import("../models/Appointment")).default;
  const User = (await import("../models/User")).default;

  await dbConnect();

  const appointments = await Appointment.find({ userId: null });
  console.log(`Found ${appointments.length} appointments without a userId.`);

  let matchedByPhone = 0;
  let matchedByName = 0;
  let unmatched = 0;

  for (const appt of appointments) {
    let user = null;

    if (appt.phone) {
      user = await User.findOne({ phone: appt.phone, role: "patient" });
      if (user) matchedByPhone++;
    }

    if (!user && appt.name) {
      user = await User.findOne({ name: appt.name, role: "patient" });
      if (user) matchedByName++;
    }

    if (user) {
      appt.userId = user._id;
      await appt.save();
    } else {
      unmatched++;
    }
  }

  console.log(`Matched by phone: ${matchedByPhone}`);
  console.log(`Matched by name:  ${matchedByName}`);
  console.log(`Unmatched (left as guest bookings): ${unmatched}`);

  await mongoose.connection.close();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
