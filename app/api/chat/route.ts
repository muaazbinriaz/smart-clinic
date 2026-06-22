import { NextResponse } from "next/server";

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY!;

const SYSTEM_PROMPT = `You are a friendly, helpful clinic receptionist for SmartClinic AI, located at Committee Chowk, Rawalpindi. 
Clinic info:
- Open 9 AM – 8 PM, Monday–Saturday.
- Phone: 03XX-XXXXXXX
- Address: Committee Chowk, Rawalpindi
Doctors:
- Dr. Ahmed, Cardiologist (15+ yrs) – Fee: 3000 PKR
- Dr. Husnain Ali, General Physician (10+ yrs) – Fee: 2000 PKR
- Dr. Ali, Dermatologist (12+ yrs) – Fee: 2500 PKR
- Dr. Fatima, Physiotherapist (8+ yrs) – Fee: 1500 PKR
Services: Cardiology, General Medicine, Dermatology, Physiotherapy.
Answer concisely, warmly, and truthfully.`;

const FALLBACK_RESPONSES: Record<string, string> = {
  timing: "We are open 9 AM to 8 PM, Monday to Saturday. Sunday closed.",
  fee: "Dr Ahmed (Cardiologist): 3000 PKR, Dr Husnain Ali (GP): 2000 PKR, Dr Ali (Dermatologist): 2500 PKR, Dr Fatima (Physiotherapist): 1500 PKR.",
  address: "We are located at Committee Chowk, Rawalpindi.",
  doctors:
    "Our doctors: Dr Ahmed (Cardiologist), Dr Husnain Ali (General Physician), Dr Ali (Dermatologist), Dr Fatima (Physiotherapist).",
  services:
    "We offer Cardiology, General Medicine, Dermatology, and Physiotherapy.",
  contact: "You can call us at 03XX-XXXXXXX.",
};

async function callOpenRouter(
  model: string,
  message: string,
): Promise<string | null> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000", // Optional
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

function ruleBasedReply(message: string): string {
  const q = message.toLowerCase();
  if (q.includes("timing") || q.includes("open"))
    return FALLBACK_RESPONSES.timing;
  if (q.includes("fee") || q.includes("price") || q.includes("cost"))
    return FALLBACK_RESPONSES.fee;
  if (q.includes("address") || q.includes("location") || q.includes("where"))
    return FALLBACK_RESPONSES.address;
  if (q.includes("doctor") || q.includes("dr"))
    return FALLBACK_RESPONSES.doctors;
  if (q.includes("service")) return FALLBACK_RESPONSES.services;
  if (q.includes("contact") || q.includes("phone") || q.includes("call"))
    return FALLBACK_RESPONSES.contact;
  if (q.includes("hi") || q.includes("hello") || q.includes("salam"))
    return "Hello! How can I help you today?";
  return "I can answer about timings, fees, doctors, services, or location. Please ask specifically!";
}

export async function POST(req: Request) {
  const { message } = await req.json();

  // Try OpenRouter free Gemini Flash first
  let reply = await callOpenRouter("google/gemini-2.0-flash-001", message);
  if (reply) return NextResponse.json({ reply });

  // Fallback to free Llama 3
  reply = await callOpenRouter("meta-llama/llama-3-8b-instruct:free", message);
  if (reply) return NextResponse.json({ reply });

  // Final fallback: rule-based
  reply = ruleBasedReply(message);
  return NextResponse.json({ reply });
}
