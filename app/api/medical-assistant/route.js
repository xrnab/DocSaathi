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

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!geminiApiKey && !groqApiKey) {
      console.error("Missing both GEMINI_API_KEY and GROQ_API_KEY in server environment");
      return NextResponse.json(
        { error: "AI service is not configured (missing Gemini or Groq API keys)." },
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

    let text = "";

    if (geminiApiKey) {
      console.log("Using Google Gemini API for Medical Assistant...");
      try {
        const mappedContents = messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }));

        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: mappedContents,
              systemInstruction: {
                parts: [{ text: systemPrompt }]
              },
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 800
              }
            })
          }
        );

        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();
          console.error("Gemini API error response:", geminiResponse.status, errorText);
          if (groqApiKey) {
            console.log("Gemini failed. Falling back to Groq Llama...");
            text = await callGroqChat(groqApiKey, systemPrompt, messages);
          } else {
            return NextResponse.json(
              { error: "Error communicating with Google Gemini service." },
              { status: geminiResponse.status }
            );
          }
        } else {
          const data = await geminiResponse.json();
          text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        }
      } catch (geminiErr) {
        console.error("Exception during Gemini Chat call:", geminiErr);
        if (groqApiKey) {
          console.log("Gemini exception. Falling back to Groq Llama...");
          text = await callGroqChat(groqApiKey, systemPrompt, messages);
        } else {
          return NextResponse.json(
            { error: geminiErr.message || "Failed to communicate with Google Gemini service." },
            { status: 500 }
          );
        }
      }
    } else {
      console.log("Using Groq API for Medical Assistant...");
      text = await callGroqChat(groqApiKey, systemPrompt, messages);
    }

    return NextResponse.json({ text: text || "" });
  } catch (e) {
    console.error("Medical Assistant API Exception:", e);
    return NextResponse.json(
      { error: e?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}

async function callGroqChat(apiKey, systemPrompt, messages) {
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
    throw new Error(errorData?.error?.message || "Groq API error");
  }

  const data = await resp.json();
  return String(data?.choices?.[0]?.message?.content || "");
}
