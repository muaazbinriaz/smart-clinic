import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Doctor from "@/models/Doctor";
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

// PATCH — admin only
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

  // Auto-update slug if name changed and slug not explicitly sent
  if (body.name && !body.slug) {
    body.slug = body.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  const doctor = await Doctor.findByIdAndUpdate(id, body, { new: true }).lean();
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
  const doctor = await Doctor.findByIdAndDelete(id);
  if (!doctor)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
