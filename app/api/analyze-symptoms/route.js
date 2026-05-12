import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { symptoms, language = "English", duration, patientType } = await req.json();

    if (!symptoms) {
      return NextResponse.json({ error: "Symptoms are required" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Groq API key not configured" }, { status: 500 });
    }

    const prompt = `
      Analyze the following symptoms for a ${patientType} patient in rural India:
      
      Symptoms: "${symptoms}"
      Duration: "${duration}"
      
      Respond in this EXACT format:
      
      URGENCY: [GREEN/YELLOW/RED]
      
      POSSIBLE CONDITIONS:
      - List 2-3 most likely conditions
      
      RECOMMENDED ACTION:
      - What the patient should do right now
      
      HOME REMEDIES:
      - Safe things they can do at home
      
      MEDICINES:
      - Common OTC medicines that may help (with dosage)
      
      SEE DOCTOR IF:
      - Warning signs that need immediate medical attention
      
      DISCLAIMER:
      This is for guidance only. Please consult a qualified doctor.

      IMPORTANT: You must respond entirely in ${language}.
    `;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are an expert medical triage assistant for rural healthcare in India. Keep language simple. Match the user's language always. Respond in the exact text format requested." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1, // Lower temperature for more consistent formatting
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Groq API Error Detail:", errorData);
      throw new Error(`Groq API returned ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Invalid response format from Groq");
    }
    const content = data.choices[0].message.content;

    return NextResponse.json({ content });
  } catch (error) {
    console.error("CRITICAL Symptom Analysis Error:", error.message);
    return NextResponse.json({
      content: `Error: ${error.message}. Please check your API key or connection.`
    }, { status: 200 });
  }
}
