import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Appointment from "@/models/Appointment";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  await dbConnect();
  await Appointment.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  await dbConnect();
  const body = await req.json();
  await Appointment.findByIdAndUpdate(params.id, body);
  return NextResponse.json({ success: true });
}
