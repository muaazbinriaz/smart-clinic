import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Appointment from "@/models/Appointment";
import { auth } from "@/lib/auth";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    await dbConnect();

    let userId: string | null = null;
    try {
      const session = await auth();
      if (session?.user?.id) userId = session.user.id;
    } catch {
      // Guest booking — fine
    }

    const body = await req.json();
    const { name, phone, doctor, date, time, email, ...rest } = body;

    const appointment = await Appointment.create({
      name,
      phone,
      doctor,
      date,
      time,
      ...rest,
      userId: userId ?? null,
    });

    // Non-blocking email — never fails the booking
    if (email) {
      resend.emails
        .send({
          from: "SmartClinic AI <onboarding@resend.dev>",
          to: email,
          subject: `✅ Appointment Confirmed — ${doctor} on ${date} at ${time}`,
          html: buildEmail({ name, doctor, date, time, phone }),
        })
        .catch((err) => console.error("Email failed:", err));
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
  return `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0"
  style="background:#fff;border-radius:16px;overflow:hidden;
         box-shadow:0 4px 24px rgba(37,99,235,0.08);max-width:600px;width:100%;">
  <tr>
    <td style="background:linear-gradient(135deg,#2563EB,#1d4ed8);padding:36px 40px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#bfdbfe;letter-spacing:2px;text-transform:uppercase;font-weight:600;">
        SmartClinic AI</p>
      <h1 style="margin:10px 0 0;font-size:26px;color:#fff;font-weight:700;">
        Appointment Confirmed ✓</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:36px 40px;">
      <p style="margin:0 0 24px;font-size:16px;color:#334155;line-height:1.6;">
        Hi <strong>${name}</strong>, your appointment has been booked. Here are your details:</p>
      <table width="100%" cellpadding="0" cellspacing="0"
        style="background:#F1F5F9;border-radius:12px;margin-bottom:28px;">
        <tr><td style="padding:24px 28px;">
          ${row("👨‍⚕️", "Doctor", doctor)}
          ${row("📅", "Date", date)}
          ${row("🕐", "Time", time)}
          ${row("📞", "Phone", phone)}
        </td></tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0"
        style="border:1px solid #BFDBFE;border-radius:12px;margin-bottom:28px;">
        <tr><td style="padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#2563EB;
                     text-transform:uppercase;letter-spacing:1px;">📍 Clinic Address</p>
          <p style="margin:0;font-size:15px;color:#334155;line-height:1.6;">
            SmartClinic AI, Main Boulevard<br/>
            Bahria Town, Rawalpindi, Pakistan<br/>
            <a href="tel:+923001234567" style="color:#2563EB;text-decoration:none;">+92 300 123 4567</a>
          </p>
        </td></tr>
      </table>
      <p style="margin:0;font-size:14px;color:#64748B;line-height:1.6;">
        Please arrive 10 minutes early. To reschedule, log in to your patient dashboard.</p>
    </td>
  </tr>
  <tr>
    <td style="background:#F1F5F9;padding:20px 40px;text-align:center;border-top:1px solid #E2E8F0;">
      <p style="margin:0;font-size:12px;color:#94A3B8;">
        © 2026 SmartClinic AI · Rawalpindi, Pakistan<br/>
        This is an automated confirmation — do not reply.
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function row(icon: string, label: string, value: string) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
    <tr>
      <td style="font-size:13px;color:#64748B;font-weight:600;text-transform:uppercase;
                  letter-spacing:0.5px;width:30%;">${icon} ${label}</td>
      <td style="font-size:15px;color:#0F172A;font-weight:500;">${value}</td>
    </tr>
  </table>`;
}
