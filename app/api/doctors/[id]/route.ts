import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Doctor from "@/models/Doctor";
import Appointment from "@/models/Appointment";
import { auth } from "@/lib/auth";

// GET single doctor (public)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await dbConnect();
  const doctor = await Doctor.findById(id).lean();
  if (!doctor)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(doctor);
}

// PATCH — admin only, with validation
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  await dbConnect();
  const body = await req.json();

  // ── Server‑side validation ────────────────────────────────────────
  const errors: string[] = [];
  if (
    body.name !== undefined &&
    (typeof body.name !== "string" || !body.name.trim())
  ) {
    errors.push("Doctor name cannot be empty.");
  }
  if (
    body.specialty !== undefined &&
    (typeof body.specialty !== "string" || !body.specialty.trim())
  ) {
    errors.push("Specialty cannot be empty.");
  }
  if (body.fee !== undefined) {
    const fee = Number(body.fee);
    if (isNaN(fee) || fee <= 0) errors.push("Fee must be a positive number.");
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  // Auto‑update slug if name changed and slug not explicitly sent
  if (body.name && !body.slug) {
    body.slug = body.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  // Explicitly use $set to ensure arrays like workingHours are replaced, not merged
  const doctor = await Doctor.findByIdAndUpdate(
    id,
    { $set: body },
    { new: true },
  ).lean();
  if (!doctor)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, doctor });
}

// DELETE — admin only
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  await dbConnect();

  const doctor = await Doctor.findById(id).lean();
  if (!doctor)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ── Guard: block delete if doctor has upcoming active appointments ──
  // "Active" = not cancelled / completed / no-show, and date is today or later.
  // Dates are stored as "YYYY-MM-DD" strings, so a lexical >= comparison
  // against today's date string works correctly.
  const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  const upcomingCount = await Appointment.countDocuments({
    doctor: doctor.name,
    date: { $gte: todayStr },
    status: { $nin: ["cancelled", "completed", "no-show"] },
  });

  if (upcomingCount > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete Dr. ${doctor.name} — they have ${upcomingCount} upcoming appointment${
          upcomingCount === 1 ? "" : "s"
        }. Cancel or reassign those appointments first.`,
      },
      { status: 400 },
    );
  }

  await Doctor.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
