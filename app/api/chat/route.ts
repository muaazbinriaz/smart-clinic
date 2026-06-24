import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import dbConnect from "@/lib/dbConnect";
import Doctor from "@/models/Doctor";

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY!;

const MODELS = [
  "openrouter/free",
  "openai/gpt-oss-120b:free",
  "openai/gpt-oss-20b:free",
  "google/gemma-4-31b-it:free",
  "google/gemma-3-4b-it:free",
  "google/gemma-3-12b-it:free",
  "google/gemma-3-27b-it:free",
  "google/gemini-2.0-flash-lite-001",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "nvidia/nemotron-nano-9b-v2:free",
  "nvidia/llama-3.1-nemotron-nano-8b-v1:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "meta-llama/llama-4-scout:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "mistralai/devstral-small:free",
  "qwen/qwen3-8b:free",
  "qwen/qwen3-14b:free",
  "qwen/qwen3-32b:free",
  "qwen/qwen-2.5-7b-instruct:free",
  "qwen/qwen2.5-vl-3b-instruct:free",
  "deepseek/deepseek-r1-distill-qwen-7b:free",
  "deepseek/deepseek-r1-distill-qwen-1.5b:free",
  "deepseek/deepseek-chat-v3-5:free",
  "microsoft/phi-4-reasoning-plus:free",
  "microsoft/phi-3-mini-128k-instruct:free",
  "moonshotai/kimi-k2.6:free",
  "z-ai/glm-4.5-air:free",
  "tngtech/deepseek-r1t-chimera:free",
  "openchat/openchat-7b:free",
  "huggingfaceh4/zephyr-7b-beta:free",
  "openrouter/owl-alpha",
];

// ── Reasoning-leak patterns that indicate a model is thinking out loud ──
// These appear at the START of the response before the actual answer.
const THINKING_PREAMBLE_PATTERNS = [
  // Tag-based (DeepSeek R1, Qwen3, Phi-4, etc.)
  /<think>[\s\S]*?<\/think>/gi,
  /<thinking>[\s\S]*?<\/thinking>/gi,
  /<scratchpad>[\s\S]*?<\/scratchpad>/gi,
  /\[thinking\][\s\S]*?\[\/thinking\]/gi,
  // Markdown reasoning blocks some models emit
  /```think[\s\S]*?```/gi,
  /```thinking[\s\S]*?```/gi,
];

// Phrases that signal the model is narrating its own reasoning in plain text.
// If a sentence/paragraph STARTS with one of these, everything up to and
// including that paragraph is considered scratchpad and is dropped.
const REASONING_SENTENCE_STARTERS = [
  "we need to",
  "i need to",
  "let me",
  "let's",
  "okay,",
  "okay.",
  "alright,",
  "alright.",
  "so,",
  "first,",
  "step 1",
  "step 2",
  "the patient",
  "the user",
  "they asked",
  "they want",
  "must be",
  "should be",
  "i should",
  "i will",
  "i'll",
  "my response",
  "my answer",
  "now i",
  "craft:",
  "let's craft",
  "make sure",
  "probably",
  "that's okay",
  "that's fine",
  "rule says",
];

function cleanModelResponse(raw: string): string {
  let text = raw;

  // 1. Strip XML-style think blocks
  for (const pattern of THINKING_PREAMBLE_PATTERNS) {
    text = text.replace(pattern, "");
  }

  // 2. Split into paragraphs and find where the actual answer starts.
  //    Drop any leading paragraph that looks like internal reasoning.
  const paragraphs = text.split(/\n\n+/);
  let startIndex = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i].trim().toLowerCase();
    const looksLikeReasoning = REASONING_SENTENCE_STARTERS.some((phrase) =>
      para.startsWith(phrase),
    );
    // Also catch multi-sentence paragraphs where MOST sentences are reasoning
    const sentences = para.split(/[.!?]\s+/);
    const reasoningSentenceCount = sentences.filter((s) =>
      REASONING_SENTENCE_STARTERS.some((p) => s.trim().startsWith(p)),
    ).length;
    const majorityReasoning =
      sentences.length > 1 && reasoningSentenceCount / sentences.length > 0.5;

    if (looksLikeReasoning || majorityReasoning) {
      startIndex = i + 1; // drop this paragraph, keep looking
    } else {
      break; // first non-reasoning paragraph — stop here
    }
  }

  text = paragraphs.slice(startIndex).join("\n\n");

  // 3. Clean up leftover blank lines
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  return text;
}

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

##CRITICAL OUTPUT RULE##
Your response must be ONLY the final message to the patient.
- NO internal reasoning, planning, or thinking
- NO sentences like "We need to respond in...", "Let me craft...", "The patient asked..."
- NO preamble of any kind
- Start your response DIRECTLY with the patient-facing content
- If you use <think> or similar tags internally, they must NOT appear in your output

━━━ LANGUAGE RULE ━━━
• English message → reply ONLY in English
• Roman Urdu (e.g. "doctor ka fee kya hai") → reply ONLY in Roman Urdu
• Urdu script → reply ONLY in Urdu script
• Match the patient's language exactly — no mixing

━━━ CLINIC INFO ━━━
Name: MediBook Clinic
Address: Committee Chowk, Rawalpindi, Punjab, Pakistan
Hours: Monday–Saturday, 9:00 AM – 6:00 PM (Sundays closed)
Phone: 03XX-XXXXXXX

━━━ LIVE DOCTORS ━━━
${doctorList}

Available specialties: ${specialties}

━━━ FORMAT ━━━
- 3-6 lines max (listing all doctors counts as "details" and is allowed)
- Each doctor on its own line when listing
- 1-2 emoji max
- End with a helpful follow-up offer
- Plain text only — no markdown headers, no asterisks

━━━ RULES ━━━
- NEVER diagnose, prescribe, or give treatment advice
- NEVER invent doctor names, fees, or specialties
- NEVER show your reasoning or planning process
- Direct all booking to the website's Book Appointment button`;
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
        temperature: 0.55,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.warn(`[chat] ${model} → HTTP ${res.status} ${err.slice(0, 80)}`);
      return null;
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) return null;

    const clean = cleanModelResponse(raw);

    // If cleaning wiped everything out, treat as failure so next model tries
    if (!clean || clean.length < 10) {
      console.warn(`[chat] ${model} → response was all reasoning, skipping`);
      return null;
    }

    return clean;
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
      q.includes("charges") ||
      q.includes("kia hai") ||
      q.includes("kya hai") ||
      q.includes("kitna")
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
    // DB failed
  }

  if (
    q.includes("timing") ||
    q.includes("open") ||
    q.includes("hours") ||
    q.includes("waqt")
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
  if (q.includes("book") || q.includes("appointment"))
    return "You can book an appointment 24/7 using the Book Appointment button on our website! 📅";
  if (
    q.includes("hi") ||
    q.includes("hello") ||
    q.includes("salam") ||
    q.includes("assalam")
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
      "You are a helpful clinic receptionist for MediBook Clinic, Rawalpindi. Reply in the patient's language. Be warm and concise. Output ONLY the final reply — no reasoning, no preamble.",
  );

  const reply = await tryModels(messages, systemPrompt);
  if (reply) return NextResponse.json({ reply });

  const lastUserMsg =
    [...messages].reverse().find((m) => m.role === "user")?.text || "";
  const fallbackReply = await buildFallbackReply(lastUserMsg);
  return NextResponse.json({ reply: fallbackReply });
}
