import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Appointment from "@/models/Appointment";
import Doctor from "@/models/Doctor";
import { auth } from "@/lib/auth";
import { Resend } from "resend";
import { sendWhatsAppTest } from "@/lib/whatsapp";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const VALID_TIME_SLOTS = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
];

// ── Sanitization helpers ──────────────────────────────────────────────
// Strips HTML tags and trims. Used on every free-text field before it
// touches the database, to prevent stored XSS and keep data clean.
function sanitizeString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/[$]/g, "") // strip leading Mongo operator char to reduce NoSQL injection surface
    .trim();
}

// Recursively sanitizes every string value in a plain object (used for
// the `...rest` spread so we don't accidentally save unsanitized fields).
function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Drop any key starting with "$" or containing "." — common NoSQL
    // injection vectors (Mongo operators / dotted field paths).
    if (key.startsWith("$") || key.includes(".")) continue;

    if (typeof value === "string") {
      clean[key] = sanitizeString(value);
    } else if (typeof value === "number" || typeof value === "boolean") {
      clean[key] = value;
    }
    // Silently drop objects/arrays/functions in rest — appointments
    // shouldn't receive nested write payloads from the client.
  }
  return clean as T;
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    let userId: string | null = null;
    try {
      const session = await auth();
      if (session?.user?.id) userId = session.user.id;
    } catch {}

    const body = await req.json();

    // ── Sanitize all incoming string fields first ──────────────────
    const name = sanitizeString(body.name);
    const phone = sanitizeString(body.phone);
    const doctor = sanitizeString(body.doctor);
    const date = sanitizeString(body.date);
    const time = sanitizeString(body.time);
    const email = body.email ? sanitizeString(body.email) : undefined;
    const rest = sanitizeObject(
      Object.fromEntries(
        Object.entries(body).filter(
          ([k]) =>
            !["name", "phone", "doctor", "date", "time", "email"].includes(k),
        ),
      ),
    );

    // ── Server‑side validation ──────────────────────────────────────
    const errors: string[] = [];

    // Required fields
    if (!name) errors.push("Full name is required.");
    if (!phone) errors.push("Phone number is required.");
    if (!doctor) errors.push("Doctor is required.");
    if (!date) errors.push("Date is required.");
    if (!time) errors.push("Time is required.");

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Invalid email format.");
    }

    // Date must not be in the past
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(date + "T00:00:00");
      if (selected < today) {
        errors.push("Cannot book an appointment in the past.");
      }
    } else if (date) {
      errors.push("Invalid date format. Use YYYY-MM-DD.");
    }

    // Time must be a valid slot
    if (time && !VALID_TIME_SLOTS.includes(time)) {
      errors.push("Invalid time slot.");
    }

    // Doctor must exist
    if (doctor) {
      const existingDoctor = await Doctor.findOne({
        name: doctor,
        available: true,
      }).lean();
      if (!existingDoctor) {
        errors.push("Selected doctor is not available.");
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    }

    // ── Create appointment (all fields already sanitized) ──────────
    let appointment;
    try {
      appointment = await Appointment.create({
        name,
        phone,
        doctor,
        date,
        time,
        email: email || undefined,
        ...rest,
        userId: userId ?? null,
      });
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: number }).code === 11000
      ) {
        return NextResponse.json(
          {
            error:
              "This time slot was just booked. Please choose another time.",
          },
          { status: 409 },
        );
      }
      throw err;
    }

    // ── Email (non‑blocking) ────────────────────────────────────────
    if (email && resend) {
      resend.emails
        .send({
          from: "SmartClinic AI <onboarding@resend.dev>",
          to: email,
          subject: `✅ Appointment Confirmed — ${doctor} on ${date} at ${time}`,
          html: buildEmail({ name, doctor, date, time, phone }),
        })
        .catch((err) => console.error("Email failed:", err));
    }

    // ── WhatsApp (non‑blocking) ──────────────────────────────────────
    // TEMP: using sendWhatsAppTest (hello_world) until appointment_confirm
    // template is approved. Swap to sendWhatsAppConfirmation once it's live —
    // see lib/whatsapp.ts for the production function.
    if (phone) {
      sendWhatsAppTest(phone)
        .then((result) => {
          if (!result.success) {
            console.error("WhatsApp send failed:", result.error);
          }
        })
        .catch((err) => console.error("WhatsApp send error:", err));
    }

    return NextResponse.json(
      { success: true, id: appointment._id },
      { status: 201 },
    );
  } catch (err) {
    console.error("Appointment creation error:", err);
    return NextResponse.json(
      { error: "Failed to save appointment." },
      { status: 500 },
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await dbConnect();
  const appointments = await Appointment.find({})
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json(appointments);
}

function buildEmail({
  name,
  doctor,
  date,
  time,
  phone,
}: {
  name: string;
  doctor: string;
  date: string;
  time: string;
  phone: string;
}) {
  return `<!DOCTYPE html>...`; // (same as before)
}
// (include the existing buildEmail and row helper functions)
