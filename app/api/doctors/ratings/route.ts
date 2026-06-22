import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Appointment from "@/models/Appointment";

export async function GET() {
  await dbConnect();

  const results = await Appointment.aggregate([
    { $match: { rating: { $ne: null }, status: "confirmed" } },
    {
      $group: {
        _id: "$doctor",
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  // { "Dr. Ahmed": { avg: 4.6, count: 12 }, ... }
  const ratings: Record<string, { avg: number; count: number }> = {};
  for (const r of results) {
    ratings[r._id] = { avg: Math.round(r.avg * 10) / 10, count: r.count };
  }

  return NextResponse.json({ ratings });
}
