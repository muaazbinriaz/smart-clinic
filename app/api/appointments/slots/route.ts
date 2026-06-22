import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Appointment from "@/models/Appointment";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const doctor = searchParams.get("doctor");
    const date = searchParams.get("date");

    if (!doctor || !date) {
      return NextResponse.json({ bookedSlots: [] });
    }

    const appointments = await Appointment.find({
      doctor,
      date,
      status: { $ne: "cancelled" },
    })
      .select("time")
      .lean();

    const bookedSlots = appointments.map((a) => a.time);
    return NextResponse.json({ bookedSlots });
  } catch (err) {
    console.error("Slots fetch error:", err);
    return NextResponse.json({ bookedSlots: [] });
  }
}
