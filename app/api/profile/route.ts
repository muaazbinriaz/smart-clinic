import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { auth } from "@/lib/auth";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json();
  const { name, phone, currentPassword, newPassword } = body as {
    name?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
  };

  await dbConnect();

  const user = await User.findById(session.user.id);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (typeof name === "string" && name.trim().length > 0) {
    user.name = name.trim();
  }
  if (typeof phone === "string") {
    user.phone = phone.trim();
  }

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json(
        { error: "Current password is required to set a new password." },
        { status: 400 },
      );
    }
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 },
      );
    }
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters." },
        { status: 400 },
      );
    }
    user.password = await bcrypt.hash(newPassword, 10);
  }

  await user.save();

  return NextResponse.json({
    success: true,
    user: { name: user.name, phone: user.phone, email: user.email },
  });
}
