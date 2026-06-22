import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Appointment from "@/models/Appointment";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await dbConnect();
  const body = await req.json();

  const update: Record<string, string | number> = {};

  if (body.status !== undefined) {
    const valid = ["pending", "confirmed", "cancelled"];
    if (!valid.includes(body.status))
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    update.status = body.status;
  }

  if (body.date !== undefined) update.date = body.date;
  if (body.time !== undefined) update.time = body.time;

  // Rating update ← new
  if (body.rating !== undefined) {
    const r = Number(body.rating);
    if (!Number.isInteger(r) || r < 1 || r > 5)
      return NextResponse.json(
        { error: "Rating must be 1–5." },
        { status: 400 },
      );
    update.rating = r;
  }

  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  const updated = await Appointment.findByIdAndUpdate(id, update, {
    new: true,
  }).lean();
  if (!updated)
    return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ success: true, appointment: updated });
}
