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

  // Auto-generate slug from name if not provided
  const slug =
    body.slug ||
    body.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

  const doctor = await Doctor.create({ ...body, slug });
  return NextResponse.json({ success: true, doctor }, { status: 201 });
}
