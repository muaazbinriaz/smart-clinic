import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Appointment from "@/models/Appointment";

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  const appointment = await Appointment.create(body);
  return NextResponse.json(
    { success: true, id: appointment._id },
    { status: 201 },
  );
}

export async function GET() {
  await dbConnect();
  const appointments = await Appointment.find({})
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json(appointments);
}
