"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

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

export async function generateHealthRiskReport(patientId = null) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      prescriptions: { where: { active: true } },
      patientAppointments: {
        where: { status: "COMPLETED" },
        orderBy: { startTime: "desc" },
        take: 5,
        select: { notes: true, doctorSummary: true, startTime: true }
      }
    }
  });

  if (!user) return { error: "User not found" };

  // Build patient context
  const bmi = user.height && user.weight 
    ? (user.weight / ((user.height / 100) ** 2)).toFixed(1) 
    : null;

  const context = `
Patient: ${user.name}, Age: ${user.age || "Unknown"}, Gender: ${user.gender || "Unknown"}
BMI: ${bmi || "Not calculated"} (Height: ${user.height || "?"}cm, Weight: ${user.weight || "?"}kg)
Blood Type: ${user.bloodType || "Unknown"}
Medical History: ${user.medicalHistory || "None recorded"}
Allergies: ${user.allergies || "None"}
Active Medications: ${user.prescriptions.map(p => `${p.name} ${p.dosage}`).join(", ") || "None"}
Recent Consultations: ${user.patientAppointments.map(a => a.doctorSummary || a.notes || "").filter(Boolean).join(" | ").slice(0, 500)}
  `.trim();

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { error: "Medical Analysis Engine (Groq) is not configured on the server." };
  }
  
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 800,
        temperature: 0.2,
        messages: [{
          role: "system",
          content: `You are a preventive healthcare AI for rural India. Analyze patient data and generate a risk report.
          
  ALWAYS respond in this EXACT JSON format only, no markdown:
  {
    "diabetesRisk": { "score": 0-100, "level": "LOW|MEDIUM|HIGH", "reason": "one sentence" },
    "hypertensionRisk": { "score": 0-100, "level": "LOW|MEDIUM|HIGH", "reason": "one sentence" },
    "cardiovascularRisk": { "score": 0-100, "level": "LOW|MEDIUM|HIGH", "reason": "one sentence" },
    "bmi": { "value": number_or_null, "category": "Underweight|Normal|Overweight|Obese|Unknown" },
    "topRecommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
    "urgentFlags": ["flag if any, else empty array"],
    "summary": "2 sentence overall health summary"
  }`
        }, {
          role: "user",
          content: context
        }]
      })
    });

    if (!response.ok) {
      throw new Error("Groq API request failed");
    }

    const data = await response.json();
    let text = data.choices[0]?.message?.content || "{}";
    text = text.replace(/```json|```/g, "").trim();
    
    const report = JSON.parse(text);
    return { success: true, report };
  } catch (err) {
    console.error("Risk Report Generation Error:", err);
    return { error: "Could not generate risk report. Try again." };
  }
}

