import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Appointment from "@/models/Appointment";
import User from "@/models/User";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  await dbConnect();

  const user = await User.findById(session.user.id).lean<{
    name: string;
    phone?: string;
  }>();

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // Primary match: appointments explicitly linked to this user's account.
  const linked = await Appointment.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  // Legacy fallback: appointments booked before the userId field existed
  // (or booked as a guest with the same name/phone before signing up).
  // Only match these when they have no userId at all, so a linked
  // appointment never gets shadowed by an unrelated phone/name collision.
  const legacyOr: Record<string, unknown>[] = [];
  if (user.phone) legacyOr.push({ phone: user.phone });
  legacyOr.push({ name: user.name });

  const legacy = await Appointment.find({
    userId: null,
    $or: legacyOr,
  })
    .sort({ createdAt: -1 })
    .lean();

  const all = [...linked, ...legacy];

  return NextResponse.json(all);
}
