// scripts/seed-doctors.ts
// tsx automatically loads .env.local before running the script

import dbConnect from "../lib/dbConnect";
import Doctor from "../models/Doctor";

async function seed() {
  await dbConnect();
  console.log("Connected to MongoDB");

  await Doctor.deleteMany({});
  await Doctor.insertMany([
    {
      name: "Dr. Ahmed",
      slug: "dr-ahmed",
      specialty: "Cardiologist",
      exp: "15+ years",
      fee: 3000,
      bio: "Fellowship in Interventional Cardiology. Expert in angioplasty and heart failure management.",
      img: "https://ui-avatars.com/api/?name=Dr+Ahmed&size=128&background=0D6EFD&color=fff&bold=true",
    },
    {
      name: "Dr. Husnain Ali",
      slug: "dr-husnain-ali",
      specialty: "General Physician",
      exp: "10+ years",
      fee: 2000,
      bio: "Specialist in diabetes, hypertension, and preventive medicine.",
      img: "https://ui-avatars.com/api/?name=Dr+Husnain+Ali&size=128&background=0D6EFD&color=fff&bold=true",
    },
    {
      name: "Dr. Ali",
      slug: "dr-ali",
      specialty: "Dermatologist",
      exp: "12+ years",
      fee: 2500,
      bio: "Cosmetic dermatology, laser treatments, and skin surgery.",
      img: "https://ui-avatars.com/api/?name=Dr+Ali&size=128&background=0D6EFD&color=fff&bold=true",
    },
    {
      name: "Dr. Fatima",
      slug: "dr-fatima",
      specialty: "Physiotherapist",
      exp: "8+ years",
      fee: 1500,
      bio: "Rehabilitation specialist, manual therapy, and sports injuries.",
      img: "https://ui-avatars.com/api/?name=Dr+Fatima&size=128&background=0D6EFD&color=fff&bold=true",
    },
  ]);

  console.log("✅ 4 doctors seeded successfully");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
