const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const hash = await bcrypt.hash("Admin@12345", 12);

  const User = mongoose.model(
    "User",
    new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      password: String,
      phone: String,
      role: { type: String, default: "patient" },
      createdAt: { type: Date, default: Date.now },
    }),
  );

  await User.create({
    name: "Admin",
    email: "admin@smartclinic.com",
    password: hash,
    role: "admin",
  });

  console.log("✅ Admin created: admin@smartclinic.com / Admin@12345");
  await mongoose.disconnect();
}

main().catch(console.error);
