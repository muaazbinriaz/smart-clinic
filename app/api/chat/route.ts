import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import dbConnect from "@/lib/dbConnect";
import Doctor from "@/models/Doctor";

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY!;

// ── Current working free models on OpenRouter (June 2026) ─────────────
const MODELS = [
  "openrouter/free", // Auto-router — picks best available free model
  "openai/gpt-oss-20b:free", // OpenAI open-weight 20B
  "openai/gpt-oss-120b:free", // OpenAI open-weight 120B
  "google/gemma-4-31b-it:free", // Google Gemma 4 31B
  "nvidia/nemotron-3-super-120b-a12b:free", // NVIDIA Nemotron 3 Super
  "nvidia/nemotron-nano-9b-v2:free", // NVIDIA Nemotron Nano 9B
  "nvidia/nemotron-3-nano-30b-a3b:free", // NVIDIA Nemotron 3 Nano
  "z-ai/glm-4.5-air:free", // GLM 4.5 Air
  "moonshotai/kimi-k2.6:free", // Kimi K2.6
  "openrouter/owl-alpha", // OpenRouter Owl Alpha
];

async function buildSystemPrompt(): Promise<string> {
  await dbConnect();
  const doctors = await Doctor.find({ available: true }).lean();

  const doctorList = doctors.length
    ? doctors
        .map(
          (d: any) =>
            `• ${d.name} — ${d.specialty}${d.exp ? `, ${d.exp} experience` : ""} — Fee: PKR ${d.fee?.toLocaleString() ?? "N/A"}`,
        )
        .join("\n")
    : "No doctors currently listed.";

  const specialties = doctors.length
    ? [...new Set(doctors.map((d: any) => d.specialty))].join(", ")
    : "General Medicine";

  return `You are MediBook Assistant — a warm, professional AI receptionist for MediBook Clinic, Rawalpindi, Pakistan.

━━━ LANGUAGE RULE (CRITICAL) ━━━
• English message → reply in English
• Roman Urdu (e.g. "doctor ka fee kya hai") → reply in Roman Urdu  
• Urdu script (اردو) → reply in Urdu script
• Never mix languages unless the patient does first
• Never ignore this rule — every single reply must match the patient's language

━━━ CLINIC INFO ━━━
Name: MediBook Clinic
Address: Committee Chowk, Rawalpindi, Punjab, Pakistan
Hours: Monday–Saturday, 9:00 AM – 6:00 PM (Sunday closed)
Phone: 03XX-XXXXXXX
Website booking: Use the "Book Appointment" button on the website

━━━ LIVE DOCTORS (fetched from database — always use this list) ━━━
${doctorList}

Available specialties: ${specialties}

━━━ RESPONSE FORMAT RULES ━━━
Always reply in clean, readable plain text. Use these formatting conventions:
- Use emoji sparingly but effectively (1-2 per response max) to add warmth
- Use line breaks to separate sections
- For lists of doctors/fees, put each on its own line
- Keep responses concise — 3-6 lines max unless the patient asks for details
- End with a helpful follow-up offer when relevant (e.g. "Would you like to book an appointment?")

━━━ EXAMPLE GOOD RESPONSES ━━━
Q: "What are the doctor fees?"
A: "Here are our current consultation fees:
[list each doctor and fee from the live list above]
💡 You can book online anytime using the Book Appointment button. Need help choosing the right doctor?"

Q: "Kya cardiology available hai?"
A: "Jee haan! Hamare paas [doctor name] hain jo Cardiology mein specialist hain — fee PKR [X] hai.
Appointment book karne ke liye website pe 'Book Appointment' button use karein. Koi aur sawal?"

━━━ STRICT RULES ━━━
- NEVER give medical diagnoses, prescriptions, or treatment advice
- NEVER make up doctor names, fees, or specialties — only use the live list above
- If asked something you don't know, say so honestly and suggest calling the clinic
- If asked about booking, always direct to the website's Book Appointment button
- Be warm and helpful, not robotic`;
}

async function callOpenRouter(
  model: string,
  messages: { role: string; text: string }[],
  systemPrompt: string,
): Promise<string | null> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://smart-clinic-three-tau.vercel.app",
        "X-Title": "MediBook Clinic",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.text,
          })),
        ],
        temperature: 0.65,
        max_tokens: 400,
      }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.warn(`[chat] ${model} → HTTP ${res.status} ${err.slice(0, 100)}`);
      return null;
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.warn(`[chat] ${model} → exception:`, e);
    return null;
  }
}

async function tryModels(
  messages: { role: string; text: string }[],
  systemPrompt: string,
): Promise<string | null> {
  for (const model of MODELS) {
    const reply = await callOpenRouter(model, messages, systemPrompt);
    if (reply) {
      console.log(`[chat] Success with model: ${model}`);
      return reply;
    }
  }
  return null;
}

async function buildFallbackReply(message: string): Promise<string> {
  const q = message.toLowerCase();
  try {
    await dbConnect();
    const doctors = await Doctor.find({ available: true }).lean();

    if (q.includes("doctor") || q.includes("dr") || q.includes("specialist")) {
      if (!doctors.length)
        return "Please call us at 03XX-XXXXXXX for doctor availability.";
      const list = doctors
        .map(
          (d: any) =>
            `• ${d.name} (${d.specialty}) — PKR ${d.fee?.toLocaleString()}`,
        )
        .join("\n");
      return `Our current doctors:\n${list}\n\nBook online anytime using the Book Appointment button! 📅`;
    }

    if (
      q.includes("fee") ||
      q.includes("price") ||
      q.includes("cost") ||
      q.includes("charges")
    ) {
      if (!doctors.length)
        return "Please call us at 03XX-XXXXXXX for fee details.";
      const list = doctors
        .map(
          (d: any) =>
            `• ${d.name} (${d.specialty}): PKR ${d.fee?.toLocaleString()}`,
        )
        .join("\n");
      return `Consultation fees:\n${list}\n\nFees may vary — confirm when booking. 💡`;
    }
  } catch {
    // DB failed — use generic fallback below
  }

  if (
    q.includes("timing") ||
    q.includes("open") ||
    q.includes("hours") ||
    q.includes("time")
  )
    return "We're open Monday–Saturday, 9:00 AM to 6:00 PM. Closed on Sundays. 🕘";
  if (
    q.includes("address") ||
    q.includes("location") ||
    q.includes("where") ||
    q.includes("kahan")
  )
    return "📍 We're located at Committee Chowk, Rawalpindi, Punjab, Pakistan.";
  if (
    q.includes("contact") ||
    q.includes("phone") ||
    q.includes("call") ||
    q.includes("number")
  )
    return "📞 You can reach us at 03XX-XXXXXXX during clinic hours (Mon–Sat, 9 AM–6 PM).";
  if (q.includes("book") || q.includes("appointment") || q.includes("appoint"))
    return "You can book an appointment 24/7 using the Book Appointment button on our website. It only takes a minute! 📅";
  if (q.includes("service") || q.includes("treatment"))
    return "We offer Cardiology, General Medicine, Dermatology, Physiotherapy, and more. Ask about a specific condition and I'll help you find the right doctor! 🏥";
  if (
    q.includes("hi") ||
    q.includes("hello") ||
    q.includes("salam") ||
    q.includes("hey")
  )
    return "Hello! 👋 Welcome to MediBook Clinic. I can help with doctor info, fees, timings, or booking. What do you need?";

  return "I can help with doctor info, fees, timings, location, or booking. What would you like to know? 😊";
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip, 5)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  let messages: { role: string; text: string }[] = [];
  if (Array.isArray(body.history) && body.history.length > 0) {
    messages = body.history;
  } else if (typeof body.message === "string" && body.message.trim()) {
    messages = [{ role: "user", text: body.message.trim() }];
  } else {
    return NextResponse.json(
      { error: "No message provided." },
      { status: 400 },
    );
  }

  const systemPrompt = await buildSystemPrompt().catch(
    () =>
      "You are a helpful clinic receptionist for MediBook Clinic, Rawalpindi. Answer in the same language the patient uses. Be warm and concise.",
  );

  const reply = await tryModels(messages, systemPrompt);
  if (reply) return NextResponse.json({ reply });

  const lastUserMsg =
    [...messages].reverse().find((m) => m.role === "user")?.text || "";
  const fallbackReply = await buildFallbackReply(lastUserMsg);
  return NextResponse.json({ reply: fallbackReply });
}
