import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { auth } from "@/lib/auth";

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const { name, phone, currentPassword, newPassword } = body;

    // ── Validation ──────────────────────────────────────────────────
    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return NextResponse.json(
        { error: "Name cannot be empty." },
        { status: 400 },
      );
    }
    if (
      phone !== undefined &&
      typeof phone === "string" &&
      phone.trim() &&
      !/^03\d{2}-?\d{7}$/.test(phone.replace(/\s/g, ""))
    ) {
      return NextResponse.json(
        { error: "Enter a valid Pakistani phone number." },
        { status: 400 },
      );
    }
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to set a new one." },
          { status: 400 },
        );
      }
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters." },
          { status: 400 },
        );
      }
    }

    const update: Record<string, string> = {};
    if (name) update.name = name.trim();
    if (phone !== undefined) update.phone = phone.trim() || "";

    if (newPassword) {
      const user = await User.findById(session.user.id).select("password");
      if (!user)
        return NextResponse.json({ error: "User not found." }, { status: 404 });

      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid)
        return NextResponse.json(
          { error: "Current password is incorrect." },
          { status: 400 },
        );

      update.password = await bcrypt.hash(newPassword, 10);
    }

    await User.findByIdAndUpdate(session.user.id, update);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}
