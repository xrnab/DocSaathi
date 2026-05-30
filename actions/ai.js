"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

// ─── GEMINI FALLBACK ────────────────────────────────────
async function callGemini(systemPrompt, userMessage) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key not configured");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: systemPrompt + "\n\n" + userMessage }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.15,
            maxOutputTokens: 2000,
          }
        })
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        err.error?.message || 
        `Gemini error ${response.status}`
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text || text.trim().length < 50) {
      throw new Error("Gemini returned empty response");
    }

    return text;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── GROQ PRIMARY ───────────────────────────────────────
async function callGroq(systemPrompt, userMessage) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Groq API key not configured");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 2000,
          temperature: 0.15,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        }),
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message ||
        `Groq error ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "Groq API error");
    }

    const result = data.choices?.[0]?.message?.content;

    if (!result || result.trim().length < 50) {
      throw new Error("Groq returned empty response");
    }

    const hasSections =
      result.includes("URGENCY") ||
      result.includes("ਅਰਜੈਂਸੀ") ||
      result.includes("तात्कालिकता") ||
      result.includes("MEDICINES") ||
      result.includes("ਦਵਾਈਆਂ") ||
      result.includes("दवाएं");

    if (!hasSections) {
      throw new Error("Groq response missing required sections");
    }

    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── VALIDATE RESPONSE ──────────────────────────────────
function validateResponse(text) {
  if (!text || text.trim().length < 50) return false;
  const hasSections =
    text.includes("URGENCY") ||
    text.includes("MEDICINES") ||
    text.includes("ਦਵਾਈਆਂ") ||
    text.includes("दवाएं") ||
    text.includes("CONDITIONS") ||
    text.includes("ਬਿਮਾਰੀ") ||
    text.includes("बीमारी");
  return hasSections;
}

// ─── MAIN EXPORT ────────────────────────────────────────
export async function analyzeSymptoms(params) {
  const { userId } = await auth();
  if (!userId) {
    return { 
      success: false, 
      error: "You must be signed in to use the AI analysis." 
    };
  }

  const { symptoms, language, patientType, duration } = params;

  const systemPrompt = `You are a senior doctor giving a direct 
clinical assessment for a patient in Nabha, Punjab, India.

STRICT RULES:
1. URGENCY line always in English exactly as shown
2. Everything else in ${language}
   Punjabi = ਗੁਰਮੁਖੀ | Hindi = हिंदी
3. Medicine names always in English
4. Be specific — never say "consult a doctor for diagnosis"
   Give your best clinical assessment directly
5. Use the symptom-specific protocols below

URGENCY: [GREEN / YELLOW / RED]

WHAT IS HAPPENING:
2-3 sentences — explain exactly what is medically 
happening in the patient's body. Be clinical and direct.

LIKELY DIAGNOSIS:
- Primary diagnosis (High/Medium confidence) — why
- Secondary possibility if relevant — why
Use Punjab-specific context where relevant.

MEDICINES:
List only medicines relevant to THIS patient's symptoms.
Format every medicine exactly like this:

▸ [MEDICINE NAME] | e.g. [Brand name]
  Dose: [exact tablets/ml]
  When: [exact schedule]
  Days: [duration]
  Why: [one line for this condition]
  ✓ Jan Aushadhi generic available [only if true]

End section with:
"⚠️ Stop any medicine and go to hospital if rash, 
swelling, or breathing difficulty occurs."

GO TO HOSPITAL IMMEDIATELY IF:
5 red flags with exact numbers and thresholds.
Always end with: "Call 108 for free ambulance."

DISCLAIMER: AI only. Not a prescription. See a doctor.

SYMPTOM PROTOCOLS:
FEVER: Paracetamol 500-650mg every 6h. Dengue risk 
Jul-Nov (no Ibuprofen if dengue suspected). Check 
malaria May-Oct. ORS for hydration.
HEADACHE: Paracetamol for tension. Ibuprofen 400mg 
for migraine. Worst headache of life = RED.
COUGH: Dextromethorphan dry cough. Guaifenesin 
productive. Azithromycin if fever >3 days.
VOMITING: Ondansetron 4mg under tongue. ORS sips.
DIARRHEA: ORS every loose stool. Zinc 20mg 14 days. 
Loperamide adults only. Azithromycin if bloody.
CHEST PAIN: Minimum YELLOW. Crushing + arm pain = 
RED heart attack, Aspirin 325mg immediately, call 108.
STOMACH PAIN: Omeprazole 20mg for acidity. 
Right lower = possible appendicitis YELLOW/RED.
DIZZINESS: ORS if dehydrated. Betahistine 16mg 
for vertigo. RED if with chest pain or fainting.
FATIGUE: Ferrous Sulphate anemia. Vitamin D3 
60000IU weekly. Blood test if >2 weeks.
SORE THROAT: Viral = gargle + Strepsils + Paracetamol. 
Bacterial pus = Amoxicillin 500mg 3x daily 7 days.
RASH: Dengue Jul-Nov = Paracetamol ONLY no Ibuprofen. 
Allergy = Cetirizine 10mg + Hydrocortisone cream.
JOINT PAIN: Dengue = Paracetamol only. 
Arthritis = Ibuprofen 400mg + Diclofenac gel.
BREATHLESSNESS: Always YELLOW+. Asthma = Salbutamol 
inhaler. Cannot speak full sentence = RED call 108.
NAUSEA: Ondansetron 4mg. Domperidone 10mg before meals. 
Pregnancy = Pyridoxine B6 25mg only.
BACK PAIN: Farm labor = Ibuprofen + Thiocolchicoside. 
Flank + fever = kidney infection, Ciprofloxacin 500mg.
PESTICIDE EXPOSURE: Always RED. Remove clothes, 
wash skin 15 min. Call 108. Atropine at hospital.
SNAKE/SCORPION BITE: Always RED. Keep still. 
Call 108. Civil Hospital Nabha has anti-venom.
HEAT STROKE: >104F + confusion = RED call 108. 
Cool with wet cloth. ORS if conscious.
EYE IRRITATION (STUBBLE): Saline wash. 
Olopatadine drops. Artificial tears. Cetirizine oral.
MUSCLE CRAMPS (FARM): ORS immediately. 
Magnesium 400mg. Thiocolchicoside if severe.
WATERBORNE ILLNESS: ORS. Typhoid = Azithromycin 
500mg 7 days. Hepatitis A = NO Paracetamol, rest only.

LOCAL RESOURCES:
Civil Hospital Nabha — free OPD
Jan Aushadhi Nabha — generics 90% cheaper
Rajindra Hospital Patiala — specialist
108 — free ambulance 24/7
Ayushman Bharat — free govt hospital treatment`;

  const userMessage = `Patient: ${patientType}
Symptoms: ${symptoms.join(", ")}
Duration: ${duration}
Location: Nabha, Punjab

Provide complete clinical assessment with all relevant 
medicines, exact doses and timings. Respond in ${language}.`.trim();

  // ── Try Groq first, fall back to Gemini ──────────────
  let result = null;
  let usedFallback = false;
  let lastError = null;

  // ATTEMPT 1: Groq
  try {
    result = await callGroq(systemPrompt, userMessage);
    console.log("✓ Groq responded successfully");
  } catch (groqError) {
    lastError = groqError;
    console.warn("⚠ Groq failed:", groqError.message, 
                 "— trying Gemini fallback");
  }

  // ATTEMPT 2: Gemini fallback if Groq failed
  if (!result || !validateResponse(result)) {
    try {
      result = await callGemini(systemPrompt, userMessage);
      usedFallback = true;
      console.log("✓ Gemini fallback responded successfully");
    } catch (geminiError) {
      console.error("✗ Gemini fallback also failed:", 
                    geminiError.message);
      // Both failed — return clear error
      return {
        success: false,
        error:
          "Medical analysis is temporarily unavailable. " +
          "Please try again in a moment. " +
          "For urgent symptoms call 108 immediately."
      };
    }
  }

  // Final validation
  if (!result || !validateResponse(result)) {
    return {
      success: false,
      error:
        "Could not generate a complete report. " +
        "Please try again. For emergencies call 108."
    };
  }

  return { 
    success: true, 
    data: result,
    provider: usedFallback ? "gemini" : "groq"
  };
}

// ─── HEALTH RISK REPORT EXPORTS ─────────────────────────
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
