import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, email, phone, password } = body;

    // ── Validation ──────────────────────────────────────────────────
    const errors: string[] = [];
    if (!name || typeof name !== "string" || !name.trim())
      errors.push("Name is required.");
    if (
      !email ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    )
      errors.push("A valid email is required.");
    if (!password || typeof password !== "string" || password.length < 6)
      errors.push("Password must be at least 6 characters.");
    if (
      phone &&
      typeof phone === "string" &&
      phone.trim() &&
      !/^03\d{2}-?\d{7}$/.test(phone.replace(/\s/g, ""))
    )
      errors.push("Enter a valid Pakistani phone number (03XX-XXXXXXX).");

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    // Check for existing user
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || undefined,
      password: hashedPassword,
      role: "patient",
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}
