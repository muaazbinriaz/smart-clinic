import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Doctor from "@/models/Doctor";
import { auth } from "@/lib/auth";

// GET — public
export async function GET() {
  await dbConnect();
  const doctors = await Doctor.find({ available: true })
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json(doctors);
}

// POST — admin only
export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await dbConnect();
  const body = await req.json();

  // ── Server‑side validation ────────────────────────────────────────
  const errors: string[] = [];
  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    errors.push("Doctor name is required.");
  }
  if (
    !body.specialty ||
    typeof body.specialty !== "string" ||
    !body.specialty.trim()
  ) {
    errors.push("Specialty is required.");
  }
  const fee = Number(body.fee);
  if (body.fee === undefined || body.fee === null || isNaN(fee) || fee <= 0) {
    errors.push("A valid fee (positive number) is required.");
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  // Auto-generate slug from name if not provided
  const slug =
    body.slug ||
    body.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

  const doctor = await Doctor.create({ ...body, slug, fee });
  return NextResponse.json({ success: true, doctor }, { status: 201 });
}
