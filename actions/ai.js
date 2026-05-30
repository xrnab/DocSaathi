"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function analyzeSymptoms(params) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in to use the AI analysis." };
  }
  const { symptoms, language, patientType, duration } = params;
  
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!geminiApiKey && !groqApiKey) {
    throw new Error("Medical Analysis Engine (Gemini/Groq) is not configured on the server.");
  }

  const systemPrompt = `You are a professional medical triage assistant for DocSaathi, a healthcare platform in India.
You are serving patients in Nabha, Punjab — an agricultural district.

CRITICAL Triage Calibration For Nabha Rural Symptoms:
- Snake/Scorpion Bite (snake_scorpion_bite) MUST ALWAYS be triaged as URGENCY: RED. Instruct the patient to go to Rajindra Hospital Patiala immediately for antivenom.
- Pesticide Exposure (pesticide_exposure) MUST ALWAYS be triaged as URGENCY: RED. Direct them to seek emergency care for potential toxicity.
- Heat Stroke (heat_stroke) MUST ALWAYS be triaged as URGENCY: RED. Instruct them to cool down immediately and seek emergency medical care.
- Chest Pain or severe Breathlessness MUST ALWAYS be triaged as URGENCY: RED.
- Waterborne Illness, severe Vomiting/Diarrhea, or moderate Dehydration should be triaged as URGENCY: YELLOW.
- Mild Eye Irritation (due to stubble burning) and Muscle Cramps (from farm labor) should be triaged as URGENCY: GREEN or YELLOW depending on severity.

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

CRITICAL FORMATTING RULES:
1. The section headers (URGENCY, POSSIBLE CONDITIONS, RECOMMENDED ACTION, HOME REMEDIES, MEDICINES, SEE DOCTOR IF, DISCLAIMER) MUST be kept in English exactly as shown above, even if the rest of the report is in ${language}. Do not translate these headers.
2. The URGENCY value MUST be either GREEN, YELLOW, or RED in English plain text (e.g. "URGENCY: RED"). Do not translate this value, and do not put any markdown asterisks on the URGENCY line.

Respond in ${language}. If language is Punjabi, respond in ਪੰਜਾਬੀ using Gurmukhi script. Keep the tone professional but accessible.`;

  const userMessage = `
Patient: ${patientType}
Duration: ${duration}
Symptoms: ${symptoms.join(", ")}
Please provide a triage report in ${language}.`.trim();

  try {
    let resultText = "";

    if (geminiApiKey) {
      console.log("Using Google Gemini API for Symptom Checker Triage...");
      try {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: userMessage }]
                }
              ],
              systemInstruction: {
                parts: [{ text: systemPrompt }]
              },
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1000
              }
            })
          }
        );

        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();
          console.error("Gemini API error response:", geminiResponse.status, errorText);
          if (groqApiKey) {
            console.log("Gemini failed. Falling back to Groq Llama for Triage...");
            resultText = await callGroqTriage(groqApiKey, systemPrompt, userMessage);
          } else {
            throw new Error("Error communicating with Google Gemini service.");
          }
        } else {
          const data = await geminiResponse.json();
          resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        }
      } catch (geminiErr) {
        console.error("Exception during Gemini Triage call:", geminiErr);
        if (groqApiKey) {
          console.log("Gemini exception. Falling back to Groq Llama for Triage...");
          resultText = await callGroqTriage(groqApiKey, systemPrompt, userMessage);
        } else {
          throw geminiErr;
        }
      }
    } else {
      console.log("Using Groq API for Symptom Checker Triage...");
      resultText = await callGroqTriage(groqApiKey, systemPrompt, userMessage);
    }

    if (!resultText) throw new Error("Could not generate analysis report");
    
    return { success: true, data: resultText };
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return { success: false, error: error.message };
  }
}

async function callGroqTriage(apiKey, systemPrompt, userMessage) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Analysis service unavailable");
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
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

  const geminiApiKey = process.env.GEMINI_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!geminiApiKey && !groqApiKey) {
    return { error: "Medical Analysis Engine (Gemini/Groq) is not configured on the server." };
  }
  
  try {
    let report = {};

    if (geminiApiKey) {
      console.log("Using Google Gemini API for Health Risk Report...");
      try {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: context }]
                }
              ],
              systemInstruction: {
                parts: [{ text: `You are a preventive healthcare AI for rural India. Analyze patient data and generate a risk report.
                
  ALWAYS respond in this EXACT JSON format only, no markdown:
  {
    "diabetesRisk": { "score": 0-100, "level": "LOW|MEDIUM|HIGH", "reason": "one sentence" },
    "hypertensionRisk": { "score": 0-100, "level": "LOW|MEDIUM|HIGH", "reason": "one sentence" },
    "cardiovascularRisk": { "score": 0-100, "level": "LOW|MEDIUM|HIGH", "reason": "one sentence" },
    "bmi": { "value": number_or_null, "category": "Underweight|Normal|Overweight|Obese|Unknown" },
    "topRecommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
    "urgentFlags": ["flag if any, else empty array"],
    "summary": "2 sentence overall health summary"
  }` }]
              },
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2,
                maxOutputTokens: 800
              }
            })
          }
        );

        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();
          console.error("Gemini Health Risk API error response:", geminiResponse.status, errorText);
          if (groqApiKey) {
            console.log("Gemini failed. Falling back to Groq Health Risk...");
            report = await callGroqHealthRisk(groqApiKey, context);
          } else {
            throw new Error("Error communicating with Google Gemini service.");
          }
        } else {
          const data = await geminiResponse.json();
          let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          report = JSON.parse(text);
        }
      } catch (geminiErr) {
        console.error("Exception during Gemini Health Risk call:", geminiErr);
        if (groqApiKey) {
          console.log("Gemini exception. Falling back to Groq Health Risk...");
          report = await callGroqHealthRisk(groqApiKey, context);
        } else {
          throw geminiErr;
        }
      }
    } else {
      console.log("Using Groq API for Health Risk Report...");
      report = await callGroqHealthRisk(groqApiKey, context);
    }

    return { success: true, report };
  } catch (err) {
    console.error("Risk Report Generation Error:", err);
    return { error: "Could not generate risk report. Try again." };
  }
}

async function callGroqHealthRisk(apiKey, context) {
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
  return JSON.parse(text);
}
