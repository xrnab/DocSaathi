"use server";

import { auth } from "@clerk/nextjs/server";

export async function analyzeSymptoms(params) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in to use the AI analysis." };
  }
  const { symptoms, language, patientType, duration } = params;
  
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Medical Analysis Engine (Groq) is not configured on the server.");
  }

  const systemPrompt = `You are a professional medical triage assistant for DocSaathi, a healthcare platform in India.
You are serving patients in Nabha, Punjab — an agricultural district. Be alert for pesticide poisoning, seasonal dengue/malaria, and occupational injuries from farm work.
Your goal is to provide safe, clear, and actionable triage advice based on user-reported symptoms.

ALWAYS respond in this exact format (do not use markdown bolding in labels):

URGENCY: [GREEN / YELLOW / RED]

POSSIBLE CONDITIONS:
- Condition 1
- Condition 2

RECOMMENDED ACTION:
- Immediate next steps. Always include this exact local referral guidance: "For this condition in Nabha, see a GP first, then get a referral to Rajindra Hospital Patiala if needed". IMPORTANT: If the triaged URGENCY is RED, you MUST append this exact sentence to the RECOMMENDED ACTION: "If you have an Ayushman Bharat card, show it at the hospital for free treatment".

HOME REMEDIES:
- Safe supportive care (if applicable)

MEDICINES:
- Common OTC medications with dosage (ALWAYS add a strong disclaimer). If recommending any standard generic medicines available on the Jan Aushadhi formulary (e.g. Paracetamol, Ibuprofen, ORS, Metformin, Cetirizine, Amoxicillin, etc.), ALWAYS append this exact note: "Available at Jan Aushadhi stores at 50-90% lower cost".

SEE DOCTOR IF:
- Specific warning signs that require urgent attention

DISCLAIMER: This is an AI-generated assessment for informational purposes only. Consult a qualified doctor immediately for medical diagnosis and treatment.

Respond in ${language}. If language is Punjabi, respond in ਪੰਜਾਬੀ using Gurmukhi script. Keep the tone professional but accessible.`;

  const userMessage = `
Patient: ${patientType}
Duration: ${duration}
Symptoms: ${symptoms.join(", ")}
Please provide a triage report in ${language}.`.trim();

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1000,
          temperature: 0.3,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Analysis service unavailable");
    }

    const data = await response.json();
    const result = data.choices[0]?.message?.content;
    
    if (!result) throw new Error("Could not generate analysis report");
    
    return { success: true, data: result };
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return { success: false, error: error.message };
  }
}
