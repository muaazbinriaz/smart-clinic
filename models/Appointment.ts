import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema({
  name: String,
  phone: String,
  doctor: String,
  date: String,
  time: String,
  message: String,
  status: { type: String, default: "pending" }, // pending, confirmed, cancelled
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Appointment ||
  mongoose.model("Appointment", AppointmentSchema);
