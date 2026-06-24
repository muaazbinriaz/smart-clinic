import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Doctor from "@/models/Doctor";
import { checkRateLimit } from "@/lib/rateLimit";

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

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function sanitize(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/<[^>]*>/g, "").trim();
}

function sanitizeResult<T extends Record<string, unknown>>(obj: T): T {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    clean[key] = typeof value === "string" ? sanitize(value) : value;
  }
  return clean as T;
}

function romanUrduToEnglish(text: string): string {
  const map: [RegExp, string][] = [
    [/sar\s*dard|sir\s*dard/gi, "headache"],
    [/bukhaar|bukhar|tapish/gi, "fever"],
    [/khansi|khaansi/gi, "cough"],
    [/gala\s*kharab|gale\s*mein\s*dard/gi, "sore throat"],
    [/naak\s*band|nazla|zukam|zukaam/gi, "cold runny nose"],
    [/pet\s*dard|pait\s*dard/gi, "stomach pain"],
    [/ulti|qay/gi, "vomiting nausea"],
    [/dast|loose\s*motion/gi, "diarrhea"],
    [/seena\s*dard|sine\s*mein|seene\s*mein/gi, "chest pain"],
    [/dil\s*ki\s*dhadkan|ghabrana/gi, "heart palpitation"],
    [/kamar\s*dard/gi, "back pain"],
    [/joron\s*mein\s*dard|jor\s*dard|ghutne/gi, "joint pain knee"],
    [/gardan\s*dard/gi, "neck pain"],
    [/ankh\s*dard|aankhon|nazar/gi, "eye vision"],
    [/daant\s*dard|dant\s*dard|masooray/gi, "tooth dental"],
    [/khujli|kharish/gi, "itch rash skin"],
    [/sugar|shakar/gi, "diabetes"],
    [/bp|blood\s*pressure/gi, "blood pressure hypertension"],
    [/kamzori|thakaan/gi, "fatigue weakness"],
    [/chakkar/gi, "dizziness vertigo"],
    [/hamal|hamla|haml/gi, "pregnancy"],
    [/masaan|gurday\s*pathri/gi, "kidney stone"],
    [/dimag/gi, "brain neurological"],
    [/haddi/gi, "bone fracture"],
    [/sans\s*lene\s*mein\s*takleef|saans\s*phoolna/gi, "breathing difficulty"],
    [/bacha|bachi|bacho/gi, "child baby"],
  ];
  let result = text;
  for (const [pattern, replacement] of map) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function buildDoctorKeywordHints(doctors: any[]): string {
  const SPECIALTY_TO_CONDITIONS: [string[], string][] = [
    [
      ["cardio", "heart"],
      "chest pain, heart disease, blood pressure, hypertension, palpitation, irregular heartbeat, angina, shortness of breath on exertion, ECG, echo",
    ],
    [
      ["derma", "skin"],
      "skin rash, itch, acne, eczema, psoriasis, hair loss, mole, skin allergy, hives, pigmentation, laser treatment, skin infection",
    ],
    [
      ["physio", "rehabilit"],
      "physiotherapy, rehabilitation, muscle strain, sport injury, posture, exercise therapy, mobility issues",
    ],
    [
      ["ortho", "bone", "joint surgeon", "surgical orthop"],
      "bone pain, joint pain, fracture, broken bone, arthritis, knee pain, hip pain, shoulder pain, back pain, spine surgery, sports injury, ligament tear",
    ],
    [
      ["neuro", "brain"],
      "headache, migraine, dizziness, seizure, epilepsy, numbness, tingling, nerve pain, paralysis, tremor, stroke, memory loss, brain tumor",
    ],
    [
      ["gynae", "gynecol", "obstet", "women"],
      "pregnancy, periods, menstrual pain, PCOS, PCOD, ovary, uterus, vaginal discharge, fertility, delivery, miscarriage, women health, hormonal issues",
    ],
    [
      ["pediatr", "child"],
      "child health, baby, infant, toddler, vaccination, growth problem, fever in children, child development",
    ],
    [
      ["dental", "dentist", "oral", "maxillo"],
      "tooth pain, teeth, gum disease, dental cavity, jaw pain, mouth ulcer, root canal, tooth extraction, braces",
    ],
    [
      ["ophthal", "eye"],
      "eye pain, vision blurry, glasses, cataract, retina, eye infection, eye allergy, sight problem, glaucoma",
    ],
    [
      ["ent", "ear", "nose", "throat"],
      "ear pain, hearing loss, tonsil, sinus, nasal, voice hoarse, throat infection, vertigo, ear wax",
    ],
    [
      ["gastro", "liver", "hepato", "stomach"],
      "stomach pain, liver disease, acid reflux, ulcer, bloating, IBS, constipation, diarrhea, nausea, jaundice, Hepatitis",
    ],
    [
      ["urol", "kidney", "nephro"],
      "urine problem, kidney stone, bladder, urinary infection, prostate, UTI, blood in urine, frequent urination",
    ],
    [
      ["psychia", "psychol", "mental"],
      "depression, anxiety, stress, panic attack, mental illness, mood disorder, insomnia, psychology, phobia",
    ],
    [
      ["endocr", "thyroid", "diabet"],
      "thyroid, diabetes, blood sugar, hormone imbalance, weight gain unexplained, metabolism, insulin",
    ],
    [
      ["pulmo", "lung", "chest", "respirat"],
      "lung disease, asthma, breathing difficulty, bronchitis, pneumonia, COPD, inhaler, chest infection, coughing blood",
    ],
    [
      ["general", "physician", "medicine", "gp", "family"],
      "fever, flu, cold, cough, sore throat, general checkup, fatigue, weakness, diabetes routine, hypertension routine, vomiting, body ache, viral infection",
    ],
    [
      ["surgeon", "surgery", "surgical"],
      "surgery needed, tumor, hernia, appendix, gallbladder, surgical procedure, operation",
    ],
  ];

  const hints: string[] = [];
  for (const doctor of doctors) {
    const specLower = normalize(doctor.specialty);
    for (const [fragments, conditions] of SPECIALTY_TO_CONDITIONS) {
      if (fragments.some((f) => specLower.includes(f))) {
        hints.push(`- "${doctor.name}" (${doctor.specialty}): ${conditions}`);
        break;
      }
    }
  }
  return hints.join("\n");
}

function buildSystemPrompt(doctors: any[]): string {
  if (doctors.length === 0) {
    return `You are a medical triage assistant. No doctors available. Return JSON only:
{"specialty":"General Medicine","recommendedDoctor":"Please visit our clinic","urgency":"low","summary":"Please visit us directly.","selfCare":"Rest and stay hydrated."}`;
  }

  const doctorList = doctors
    .map(
      (doc: any, i: number) =>
        `${i + 1}. Name: "${doc.name}" | Specialty: "${doc.specialty}"`,
    )
    .join("\n");

  const conditionHints = buildDoctorKeywordHints(doctors);

  return `You are a medical triage AI for MediBook Clinic, Rawalpindi, Pakistan.

DOCTORS (pick ONLY from this list):
${doctorList}

WHAT EACH DOCTOR TREATS:
${conditionHints}

LANGUAGE RULE:
- English input → English summary/selfCare
- Roman Urdu input → Roman Urdu summary/selfCare
- Urdu script → Urdu script summary/selfCare

TASK: Match the patient's symptoms to the most relevant doctor from the list.
"recommendedDoctor" must be copied EXACTLY from the list above.

URGENCY: high=chest+arm pain/stroke/severe bleeding, medium=worsening 3+ days, low=mild/routine

RESPOND WITH ONLY THIS JSON — no markdown, no extra text:
{
  "specialty": "exact specialty of chosen doctor",
  "recommendedDoctor": "exact name from list",
  "urgency": "low",
  "summary": "1-2 sentences in patient's language",
  "selfCare": "one safe tip in patient's language"
}`;
}

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
        "HTTP-Referer": "https://smart-clinic-three-tau.vercel.app",
        "X-Title": "MediBook Clinic",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.1,
        max_tokens: 400,
      }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.warn(
        `[symptom-check] ${model} → HTTP ${res.status} ${err.slice(0, 100)}`,
      );
      return null;
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.warn(`[symptom-check] ${model} → exception:`, e);
    return null;
  }
}

function resolveDoctor(parsed: any, doctors: any[]): any | null {
  const aiName = normalize(parsed.recommendedDoctor || "");
  const aiSpec = normalize(parsed.specialty || "");

  let m = doctors.find((d) => normalize(d.name) === aiName);
  if (m) return m;

  m = doctors.find((d) => {
    const n = normalize(d.name);
    return n.includes(aiName) || aiName.includes(n);
  });
  if (m) return m;

  m = doctors.find((d) => normalize(d.specialty) === aiSpec);
  if (m) return m;

  m = doctors.find((d) => {
    const s = normalize(d.specialty);
    return s.includes(aiSpec) || aiSpec.includes(s);
  });
  if (m) return m;

  m = doctors.find((d) => {
    const dbWords = normalize(d.specialty)
      .split(" ")
      .filter((w) => w.length > 3);
    const aiWords = aiSpec.split(" ").filter((w) => w.length > 3);
    return dbWords.some((w) => aiWords.includes(w));
  });
  if (m) return m;

  return null;
}

function keywordFallback(rawSymptoms: string, doctors: any[]): object {
  if (!doctors.length) {
    return {
      specialty: "General Medicine",
      recommendedDoctor: "Please visit our clinic",
      urgency: "low",
      summary: "Please contact us directly for assistance.",
      selfCare: "Rest and stay hydrated.",
    };
  }

  const symptoms = normalize(romanUrduToEnglish(rawSymptoms));

  const SPEC_SYMPTOM_KEYWORDS: [string[], string[]][] = [
    [
      ["cardio", "heart"],
      [
        "chest pain",
        "chest tightness",
        "heart",
        "blood pressure",
        "hypertension",
        "palpitation",
        "cardiac",
        "angina",
        "ecg",
      ],
    ],
    [
      ["derma", "skin"],
      [
        "skin",
        "rash",
        "itch",
        "acne",
        "hair loss",
        "mole",
        "eczema",
        "psoriasis",
        "hives",
        "pigment",
      ],
    ],
    [
      ["physio", "rehabilit"],
      [
        "physiotherapy",
        "rehabilitation",
        "muscle strain",
        "sport injury",
        "posture",
        "mobility",
      ],
    ],
    [
      ["ortho", "bone", "joint surg", "surgical ortho"],
      [
        "bone",
        "joint",
        "fracture",
        "broken",
        "arthritis",
        "knee pain",
        "hip pain",
        "shoulder pain",
        "spine",
        "ligament",
        "joints and bone",
        "joint and bone",
        "haddi",
      ],
    ],
    [
      ["neuro", "brain"],
      [
        "headache",
        "migraine",
        "dizzy",
        "dizziness",
        "seizure",
        "numbness",
        "tingling",
        "nerve",
        "brain",
        "paralysis",
        "tremor",
        "stroke",
        "memory",
      ],
    ],
    [
      ["gynae", "gynecol", "obstet", "women"],
      [
        "pregnancy",
        "pregnant",
        "period",
        "menstrual",
        "pcos",
        "pcod",
        "ovary",
        "uterus",
        "women",
        "gynae",
        "gynecol",
        "fertility",
        "delivery",
        "hamal",
      ],
    ],
    [
      ["pediatr", "child"],
      ["child", "baby", "infant", "toddler", "kid", "bacha", "bachi"],
    ],
    [
      ["dental", "dentist", "oral"],
      ["tooth", "teeth", "gum", "dental", "cavity", "jaw", "mouth ulcer"],
    ],
    [
      ["ophthal", "eye"],
      [
        "eye",
        "vision",
        "blurry",
        "sight",
        "glasses",
        "cataract",
        "retina",
        "ankh",
      ],
    ],
    [
      ["ent", "ear nose", "throat"],
      ["ear", "hearing", "tonsil", "sinus", "nasal", "hoarse", "vertigo"],
    ],
    [
      ["gastro", "liver", "hepato"],
      [
        "stomach",
        "liver",
        "acid reflux",
        "ulcer",
        "bloating",
        "ibs",
        "constipation",
        "diarrhea",
        "nausea",
        "jaundice",
      ],
    ],
    [
      ["urol", "kidney", "nephro"],
      ["urine", "kidney", "bladder", "urinary", "prostate", "stone", "uti"],
    ],
    [
      ["psychia", "psychol", "mental"],
      [
        "depression",
        "anxiety",
        "stress",
        "panic",
        "mental",
        "mood",
        "insomnia",
      ],
    ],
    [
      ["endocr", "thyroid", "diabet"],
      ["thyroid", "diabetes", "sugar", "hormone", "insulin", "weight gain"],
    ],
    [
      ["pulmo", "lung", "respirat"],
      [
        "lung",
        "asthma",
        "breathing",
        "bronchitis",
        "pneumonia",
        "copd",
        "saans",
      ],
    ],
    [
      ["surgeon", "surgery", "surgical"],
      ["surgery", "tumor", "hernia", "appendix", "gallbladder", "operation"],
    ],
    [
      ["general", "physician", "medicine", "gp", "family"],
      [
        "fever",
        "flu",
        "cold",
        "cough",
        "sore throat",
        "fatigue",
        "weakness",
        "checkup",
        "vomiting",
        "body ache",
        "bukhaar",
        "khansi",
      ],
    ],
  ];

  for (const [specFragments, symptomKeywords] of SPEC_SYMPTOM_KEYWORDS) {
    const symptomHit = symptomKeywords.some((kw) => symptoms.includes(kw));
    if (!symptomHit) continue;
    const doctor = doctors.find((d) => {
      const spec = normalize(d.specialty);
      return specFragments.some((f) => spec.includes(f));
    });
    if (doctor) {
      return {
        specialty: doctor.specialty,
        recommendedDoctor: doctor.name,
        urgency: "low",
        summary: `Based on your symptoms, ${doctor.name} (${doctor.specialty}) would be the right specialist to see.`,
        selfCare:
          "Rest, stay hydrated, and avoid strenuous activity until you see the doctor.",
      };
    }
  }

  const fallback =
    doctors.find((d) => /general|physician|medicine|gp/i.test(d.specialty)) ||
    doctors[0];

  return {
    specialty: fallback.specialty,
    recommendedDoctor: fallback.name,
    urgency: "low",
    summary: `A ${fallback.specialty} can evaluate your symptoms and guide you to the right care.`,
    selfCare: "Rest and stay hydrated.",
  };
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

  try {
    const body = await req.json();
    const symptoms = sanitize(body.symptoms);

    if (!symptoms || symptoms.length < 3) {
      return NextResponse.json(
        { error: "Please describe your symptoms." },
        { status: 400 },
      );
    }

    await dbConnect();
    const doctors: any[] = await Doctor.find({ available: true }).lean();

    const translated = romanUrduToEnglish(symptoms);
    const aiInput =
      translated !== symptoms
        ? `Patient wrote: "${symptoms}"\nMeaning: "${translated}"`
        : symptoms;

    const systemPrompt = buildSystemPrompt(doctors);

    let matched: any = null;
    let parsedResult: any = null;

    for (const model of MODELS) {
      const aiReply = await callOpenRouter(model, aiInput, systemPrompt);
      if (!aiReply) continue;

      try {
        const cleaned = aiReply.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        const doctor = resolveDoctor(parsed, doctors);

        if (doctor) {
          matched = doctor;
          parsedResult = parsed;
          console.log(`[symptom-check] Success with model: ${model}`);
          break;
        }
        console.warn(
          `[symptom-check] ${model} returned unresolvable doctor: "${parsed.recommendedDoctor}"`,
        );
      } catch {
        console.warn(`[symptom-check] ${model} returned non-JSON, trying next`);
      }
    }

    if (matched && parsedResult) {
      return NextResponse.json(
        sanitizeResult({
          specialty: matched.specialty,
          recommendedDoctor: matched.name,
          urgency: parsedResult.urgency || "low",
          summary:
            sanitize(parsedResult.summary) ||
            `${matched.name} (${matched.specialty}) is the right specialist for your symptoms.`,
          selfCare:
            sanitize(parsedResult.selfCare) || "Rest and stay hydrated.",
        }),
      );
    }

    console.warn("[symptom-check] All models failed — using keyword fallback");
    const fallback = keywordFallback(symptoms, doctors);
    return NextResponse.json(
      sanitizeResult(fallback as Record<string, unknown>),
    );
  } catch (err) {
    console.error("[symptom-check] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
