import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  name: String,
  phone: String,
  doctor: String,
  date: String,
  time: String,
  message: String,
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "completed", "no-show"],
    default: "pending",
  },
  rating: { type: Number, min: 1, max: 5, default: null },
  createdAt: { type: Date, default: Date.now },
});

// Unique partial index (unchanged)
AppointmentSchema.index(
  { doctor: 1, date: 1, time: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "confirmed"] } },
  },
);

export default mongoose.models.Appointment ||
  mongoose.model("Appointment", AppointmentSchema);
