const WHATSAPP_API_VERSION = "v21.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;

function formatPakistaniNumber(phone: string): string {
  // Strip everything except digits
  let digits = phone.replace(/\D/g, "");
  // Convert local format (03XXXXXXXXX) to international (92XXXXXXXXXX)
  if (digits.startsWith("0")) {
    digits = "92" + digits.slice(1);
  }
  // If it doesn't already start with 92, assume it's missing country code
  if (!digits.startsWith("92")) {
    digits = "92" + digits;
  }
  return digits;
}

interface SendResult {
  success: boolean;
  error?: string;
}

// ─── TEST FUNCTION — uses hello_world (no variables) ──────────────────
// Use this now while appointment_confirm is in review.
export async function sendWhatsAppTest(toPhone: string): Promise<SendResult> {
  const to = formatPakistaniNumber(toPhone);
  try {
    const res = await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: "hello_world",
            language: { code: "en_US" },
          },
        }),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      console.error("[WhatsApp] Send failed:", data);
      return { success: false, error: data?.error?.message || "Unknown error" };
    }
    return { success: true };
  } catch (err) {
    console.error("[WhatsApp] Network error:", err);
    return { success: false, error: "Network error" };
  }
}

// ─── PRODUCTION FUNCTION — uses appointment_confirm (once approved) ───
// Swap the call in route.ts from sendWhatsAppTest to this once your
// template status changes from "In review" to "Active".
export async function sendWhatsAppConfirmation(
  toPhone: string,
  patientName: string,
  doctorName: string,
  date: string,
  time: string,
): Promise<SendResult> {
  const to = formatPakistaniNumber(toPhone);
  try {
    const res = await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: "appointment_confirm",
            language: { code: "en" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: patientName },
                  { type: "text", text: doctorName },
                  { type: "text", text: date },
                  { type: "text", text: time },
                ],
              },
            ],
          },
        }),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      console.error("[WhatsApp] Send failed:", data);
      return { success: false, error: data?.error?.message || "Unknown error" };
    }
    return { success: true };
  } catch (err) {
    console.error("[WhatsApp] Network error:", err);
    return { success: false, error: "Network error" };
  }
}
