import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  name: String,
  phone: String,
  doctor: String,
  date: String,
  time: String,
  message: String,
  status: { type: String, default: "pending" },
  rating: { type: Number, min: 1, max: 5, default: null }, // ← new
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Appointment ||
  mongoose.model("Appointment", AppointmentSchema);
