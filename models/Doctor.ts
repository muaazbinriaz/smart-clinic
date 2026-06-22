import mongoose from "mongoose";

const DoctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true }, // URL-friendly, e.g. "dr-ahmed"
  specialty: { type: String, required: true },
  exp: String,
  fee: { type: Number, required: true }, // PKR
  bio: String,
  img: String, // avatar URL
  available: { type: Boolean, default: true },
  rating: { type: Number, default: 5.0 }, // optional, can be overridden by actual ratings later
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Doctor || mongoose.model("Doctor", DoctorSchema);
