import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a medical assistant for Nabha, Punjab block (an agricultural district). Be alert for pesticide poisoning, seasonal dengue/malaria, and occupational injuries from farm work when relevant. When a user asks about a medicine or symptom, respond with this EXACT structure (using these labels):

1. NAME: [Medicine Name]
2. TREATS: [What it treats/used for]
3. DOSAGE: [Clear dosage for adults and children]
4. TIMING: [When to take, e.g., morning/night, with/without food]
5. SIDE_EFFECTS: [List 3-5 common side effects, comma separated]
6. WARNING: [When to see a doctor immediately. Always append this exact note: "For severe conditions in Nabha, see a GP first, then get a referral to Rajindra Hospital Patiala if needed".]

IMPORTANT: 
- Do NOT use markdown bolding (**) in the labels.
- Keep responses clear and simple for low-literacy users.
- If the recommended or queried medicine is a standard generic on the Jan Aushadhi formulary (e.g. Paracetamol, Amoxicillin, ORS, Metformin, Ibuprofen, Cetirizine, etc.), ALWAYS append this exact note to your response under the WARNING section: "Available at Jan Aushadhi stores at 50-90% lower cost".
- Always add a disclaimer that this is informational only and not a substitute for professional medical advice.`;

const SUPPORTED_LANGUAGES = new Map([
  ["Punjabi", "Punjabi"],
  ["English", "English"],
  ["Hindi", "Hindi"],
  ["Bengali", "Bengali"],
  ["Tamil", "Tamil"],
  ["Telugu", "Telugu"],
]);

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("Missing GROQ_API_KEY in server environment");
      return NextResponse.json(
        { error: "Missing GROQ_API_KEY in server environment" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    const incomingMessages = Array.isArray(body?.messages) ? body.messages : [];
    const requestedLanguage =
      typeof body?.language === "string" ? body.language.trim() : "English";
    const language = SUPPORTED_LANGUAGES.get(requestedLanguage) || "English";
    const systemPrompt = `${SYSTEM_PROMPT}\n\nRespond in ${language}.${language === "Punjabi" ? " If language is Punjabi, respond in ਪੰਜਾਬੀ using Gurmukhi script." : ""}`;

    // Normalize messages to OpenAI/Groq chat format.
    const messages = incomingMessages
      .filter((m) => m && (m.role === "user" || m.role === "assistant"))
      .map((m) => ({
        role: m.role,
        content:
          typeof m.content === "string" ? m.content : String(m.content ?? ""),
      }))
      .filter((m) => m.content.trim().length > 0)
      .slice(-20);

    if (messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    console.log("Sending request to Groq with model: llama-3.3-70b-versatile");
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        max_tokens: 800,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      console.error("Groq API error:", errorData);
      return NextResponse.json(
        { error: errorData?.error?.message || "Groq API error" },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    const text = String(data?.choices?.[0]?.message?.content || "");

    return NextResponse.json({ text: text || "" });
  } catch (e) {
    console.error("Medical Assistant API Exception:", e);
    return NextResponse.json(
      { error: e?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}

