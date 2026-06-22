import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Doctor from "@/models/Doctor";

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY!;

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

// ─── Keyword map – every new doctor’s specialty will be matched if a keyword
//     points to a substring of their specialty name. ─────────────────────────
const SYMPTOM_MAP: { keywords: string[]; specialtyMatch: string }[] = [
  {
    keywords: [
      // general neurological symptoms
      "headache",
      "migraine",
      "dizziness",
      "dizzy",
      "seizure",
      "numbness",
      "tingling",
      "memory loss",
      "blurred vision",
      "fainting",
      // nerve / brain / spine related
      "nerve",
      "neuro",
      "neurosurgeon",
      "neurosurgery",
      "neurological",
      "spinal",
      "spine",
      "brain",
      // common misspellings (users often type these)
      "nuero",
      "neuro surgeion",
      "nerve pain",
    ],
    specialtyMatch: "neuro",
  },
  {
    keywords: [
      "chest pain",
      "chest tightness",
      "palpitation",
      "heart",
      "blood pressure",
      "shortness of breath",
    ],
    specialtyMatch: "cardio",
  },
  {
    keywords: ["rash", "itch", "acne", "skin", "hair loss", "mole"],
    specialtyMatch: "derma",
  },
  {
    keywords: [
      "back pain",
      "joint pain",
      "muscle",
      "sprain",
      "knee",
      "shoulder pain",
      "neck pain",
    ],
    specialtyMatch: "physio",
  },
  {
    keywords: [
      "fever",
      "flu",
      "cold",
      "cough",
      "sore throat",
      "checkup",
      "diabetes",
      "hypertension",
    ],
    specialtyMatch: "general",
  },
  {
    keywords: ["tooth", "teeth", "gum", "dental"],
    specialtyMatch: "dent",
  },
  {
    keywords: ["eye", "vision", "blurry"],
    specialtyMatch: "ophthal",
  },
  {
    keywords: ["child", "baby", "infant", "kid"],
    specialtyMatch: "pediatr",
  },
];

// ─── Build dynamic AI prompt ───────────────────────────────────────────
async function buildSystemPrompt(): Promise<string> {
  await dbConnect();
  const doctors = await Doctor.find({ available: true }).lean();

  if (doctors.length === 0) {
    return `You are a medical triage assistant for SmartClinic AI in Rawalpindi, Pakistan.
No doctors are currently listed. Recommend a general physician and suggest booking an appointment.

Respond ONLY with a valid JSON object. No markdown, no backticks, no explanation — raw JSON only.
Format:
{
  "specialty": "string",
  "recommendedDoctor": "string",
  "urgency": "low" | "medium" | "high",
  "summary": "string",
  "selfCare": "string"
}`;
  }

  const doctorList = doctors
    .map(
      (doc: any) =>
        `- ${doc.name} — ${doc.specialty} (${doc.exp || "experienced"}) — Fee: ${doc.fee} PKR`,
    )
    .join("\n");

  return `You are a medical triage assistant for SmartClinic AI in Rawalpindi, Pakistan.
The clinic has these doctors:
${doctorList}

Given the patient's symptoms, respond ONLY with a valid JSON object. No markdown, no backticks, no explanation — raw JSON only.

Format:
{
  "specialty": "string — medical specialty needed",
  "recommendedDoctor": "string — exact doctor name from the list above, copied character-for-character",
  "urgency": "low" | "medium" | "high",
  "summary": "string — 1-2 sentence friendly explanation of why this doctor",
  "selfCare": "string — one safe self-care tip while waiting for appointment"
}

If symptoms sound like a medical emergency (chest pain + left arm pain, difficulty breathing, stroke symptoms, severe bleeding), set urgency to "high" and summary should recommend going to an emergency room immediately.

IMPORTANT: "recommendedDoctor" MUST be copied exactly from the list above, including "Dr." and punctuation. Always respond with ONLY the JSON object. Nothing else.`;
}

// ─── Call OpenRouter ──────────────────────────────────────────────────────
async function callOpenRouter(
  model: string,
  message: string,
  systemPrompt: string,
): Promise<string | null> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });
    if (!res.ok) {
      console.error(
        `[symptom-check] OpenRouter ${model} HTTP ${res.status}: ${await res.text()}`,
      );
      return null;
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || null;
    if (!content) {
      console.error(
        `[symptom-check] OpenRouter ${model} returned no content:`,
        JSON.stringify(data),
      );
    }
    return content;
  } catch (err) {
    console.error(`[symptom-check] OpenRouter ${model} threw:`, err);
    return null;
  }
}

// ─── Dynamic keyword-based fallback ─────────────────────────────────────
async function dynamicFallback(symptoms: string): Promise<object> {
  await dbConnect();
  const doctors: any[] = await Doctor.find({ available: true }).lean();

  if (!doctors.length) {
    return {
      specialty: "General Medicine",
      recommendedDoctor: "Please check our doctors list",
      urgency: "low",
      summary: "No doctors are currently available. Please try again later.",
      selfCare: "Rest and stay hydrated.",
    };
  }

  const symptomLower = normalize(symptoms);

  // 1) Keyword → specialty mapping
  let bestMatch: any = null;
  for (const entry of SYMPTOM_MAP) {
    if (entry.keywords.some((kw) => symptomLower.includes(kw))) {
      const doc = doctors.find((d) =>
        normalize(d.specialty).includes(entry.specialtyMatch),
      );
      if (doc) {
        bestMatch = doc;
        break;
      }
    }
  }

  // 2) Fallback: does the user literally mention a doctor's name or specialty?
  if (!bestMatch) {
    for (const doc of doctors) {
      const nameLower = normalize(doc.name);
      const specialtyLower = normalize(doc.specialty);
      if (
        symptomLower.includes(nameLower) ||
        symptomLower.includes(specialtyLower)
      ) {
        bestMatch = doc;
        break;
      }
    }
  }

  // 3) Last resort: General Physician if one exists, else first doctor
  const chosen =
    bestMatch ||
    doctors.find((d) => normalize(d.specialty).includes("general")) ||
    doctors[0];

  return {
    specialty: chosen.specialty,
    recommendedDoctor: chosen.name,
    urgency: "low",
    summary: bestMatch
      ? `${chosen.name} (${chosen.specialty}) appears to be the right specialist for your symptoms.`
      : `We couldn't pinpoint a specialist from your description, so a ${chosen.specialty.toLowerCase()} is a safe starting point.`,
    selfCare: "Rest, stay hydrated, and avoid strenuous activity.",
  };
}

// ─── Main handler ───────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { symptoms } = await req.json();
    if (
      !symptoms ||
      typeof symptoms !== "string" ||
      symptoms.trim().length < 3
    ) {
      return NextResponse.json(
        { error: "Please describe your symptoms." },
        { status: 400 },
      );
    }

    const systemPrompt = await buildSystemPrompt();

    let aiReply = await callOpenRouter(
      "google/gemini-2.0-flash-001",
      symptoms,
      systemPrompt,
    );
    if (!aiReply) {
      aiReply = await callOpenRouter(
        "meta-llama/llama-3-8b-instruct:free",
        symptoms,
        systemPrompt,
      );
    }

    if (aiReply) {
      try {
        const cleaned = aiReply.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        const availableDoctors = await Doctor.find({ available: true }).lean();
        const matchedDoctor = availableDoctors.find(
          (doc: any) =>
            normalize(doc.name) === normalize(parsed.recommendedDoctor || ""),
        );

        if (matchedDoctor) {
          return NextResponse.json({
            ...parsed,
            recommendedDoctor: matchedDoctor.name,
            specialty: matchedDoctor.specialty,
          });
        }

        console.warn(
          `[symptom-check] AI recommended "${parsed.recommendedDoctor}" which doesn't match any doctor in DB — falling back.`,
        );
      } catch (err) {
        console.error("[symptom-check] Failed to parse AI JSON:", aiReply, err);
      }
    } else {
      console.warn(
        "[symptom-check] Both AI models failed — using keyword fallback.",
      );
    }

    const fallback = await dynamicFallback(symptoms);
    return NextResponse.json(fallback);
  } catch (err) {
    console.error("Symptom check error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
