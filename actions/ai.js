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

━━━━━━━━━━━━━━━━━━━━━━━━━
SYMPTOM-SPECIFIC PROTOCOLS
Use these when the symptom is reported:
━━━━━━━━━━━━━━━━━━━━━━━━━

FEVER:
- If mild (<100.4°F/38°C): Paracetamol 500mg
- If moderate (100-103°F): Paracetamol 650mg + 
  Ibuprofen 400mg alternating every 4 hours
- If high (>103°F/39.4°C): RED urgency
- Always consider: dengue (Jul-Nov Punjab), 
  malaria (May-Oct), typhoid (contaminated water)
- Dengue red flags: platelet drop, bleeding, 
  pain behind eyes, rash — if suspected: NO Ibuprofen
- Medicines: Paracetamol, ORS (dehydration), 
  Cetirizine (if allergic component)

HEADACHE:
- Tension: Paracetamol 500mg + rest
- Migraine: Ibuprofen 400mg + dark quiet room + 
  Domperidone 10mg for nausea
- Severe/sudden worst headache of life: RED — 
  possible meningitis or hemorrhage
- With fever: consider meningitis, dengue, typhoid
- Medicines: Paracetamol, Ibuprofen, 
  Domperidone (nausea), Caffeine+Paracetamol combo

COUGH:
- Dry cough: Dextromethorphan 15mg syrup or 
  Honey-based linctus
- Productive cough: Guaifenesin (expectorant) + 
  steam inhalation
- With fever >3 days: consider pneumonia — 
  Azithromycin 500mg day 1, 250mg days 2-5
- With breathlessness: RED — possible pneumonia/asthma
- Medicines: Dextromethorphan, Guaifenesin, 
  Levosalbutamol inhaler (if asthma), Azithromycin

VOMITING:
- Ondansetron 4mg (dissolve under tongue) every 8 hours
- ORS sachets — small sips continuously
- Domperidone 10mg before meals if chronic
- If blood in vomit: RED immediately
- If after pesticide exposure: RED — call 108
- Medicines: Ondansetron, Domperidone, ORS, 
  Pantoprazole 40mg (if acidity related)

DIARRHEA:
- ORS is the most important medicine — 1 sachet 
  per loose stool
- Zinc 20mg once daily for 14 days (adults + children)
- Loperamide 2mg after each loose stool (adults only, 
  max 16mg/day) — do NOT give to children under 12
- Antibiotic only if bloody diarrhea or cholera suspected: 
  Azithromycin 500mg once daily for 3 days
- If >10 loose stools/day or blood in stool: YELLOW/RED
- Medicines: ORS, Zinc, Loperamide, Azithromycin

CHEST PAIN:
- Any chest pain: YELLOW minimum — do not ignore
- Crushing/squeezing + left arm pain + sweating: 
  RED — heart attack, call 108 immediately
- Sharp worse on breathing: pleurisy or costochondritis
- Aspirin 325mg immediately if heart attack suspected
- Never give Ibuprofen if cardiac chest pain suspected
- Medicines: Aspirin (cardiac only), 
  Pantoprazole (if acidity), Paracetamol (musculoskeletal)

STOMACH PAIN:
- Upper abdomen + burning: acidity/GERD — 
  Omeprazole 20mg empty stomach + Antacid after meals
- Right lower: possible appendicitis — YELLOW/RED
- Cramping + diarrhea: gastroenteritis — ORS + Zinc
- Severe constant pain: RED
- Medicines: Omeprazole, Pantoprazole, Antacid 
  (Gelusil/Digene), Mefenamic acid for cramps,
  Dicyclomine for spasms

DIZZINESS:
- With low BP/dehydration: ORS + lie down + fluids
- With ear problem: Betahistine 16mg twice daily
- With vomiting: Domperidone + ORS
- Sudden severe vertigo: Betahistine + Cinnarizine
- With chest pain or fainting: RED
- Medicines: Betahistine, Cinnarizine, ORS, 
  Domperidone

FATIGUE:
- Sudden onset with fever: viral infection
- Prolonged >2 weeks: check for anemia, 
  hypothyroid, diabetes — needs blood test
- Iron deficiency anemia (common in Punjab): 
  Ferrous Sulphate 200mg twice daily with Vitamin C
- Vitamin D deficiency: Vitamin D3 60,000IU 
  once weekly for 8 weeks
- Medicines: Ferrous Sulphate, Vitamin B12, 
  Vitamin D3, Multivitamin

SORE THROAT:
- Viral (no pus): Antiseptic gargle (Povidone-Iodine) 
  + Strepsils lozenges + Paracetamol
- Bacterial/pus visible: Amoxicillin 500mg three 
  times daily for 7 days (full course)
- Severe difficulty swallowing: YELLOW
- Medicines: Amoxicillin, Paracetamol, 
  Povidone-Iodine gargle, Benzocaine lozenges,
  Cetirizine (if allergy component)

RASH:
- With fever in Punjab Jul-Nov: dengue — no Ibuprofen, 
  Paracetamol only, blood test urgently
- Allergic (hives, itchy): Cetirizine 10mg + 
  Hydrocortisone cream 1%
- Spreading rapidly or with breathing difficulty: 
  RED — anaphylaxis
- Medicines: Cetirizine, Chlorpheniramine, 
  Hydrocortisone cream, Calamine lotion

JOINT PAIN:
- Dengue arthralgia: Paracetamol only (no Ibuprofen)
- Osteoarthritis/general: Ibuprofen 400mg + 
  Diclofenac gel topically
- Gout (big toe, sudden): Colchicine 0.5mg + 
  Indomethacin, avoid purine foods
- Rheumatoid (multiple joints, morning stiffness): 
  needs specialist — give Hydroxychloroquine referral
- Medicines: Paracetamol, Ibuprofen, Diclofenac gel, 
  Colchicine

BREATHLESSNESS:
- Any breathlessness: YELLOW minimum
- With chest pain: RED — heart or PE
- Asthma attack: Salbutamol inhaler 2 puffs 
  every 20 minutes + sit upright
- COPD exacerbation (smoker/farm worker): 
  Salbutamol + Ipratropium inhaler
- Severe — cannot speak full sentence: RED call 108
- Medicines: Salbutamol inhaler, Montelukast, 
  Budesonide inhaler (preventive)

NAUSEA:
- Ondansetron 4mg under tongue (fast acting)
- Domperidone 10mg before meals
- With acidity: Omeprazole 20mg + Antacid
- Pregnancy nausea: only B6 (Pyridoxine) 25mg, 
  safe in pregnancy
- Medicines: Ondansetron, Domperidone, 
  Pyridoxine B6, Omeprazole

BACK PAIN:
- Muscle/posture (farm labor): Ibuprofen 400mg + 
  Diclofenac gel + muscle relaxant (Thiocolchicoside)
- With leg numbness/weakness: YELLOW — nerve compression
- Kidney pain (flank, with fever): UTI/kidney stone — 
  urine test needed, Ciprofloxacin 500mg if infection
- Severe sudden: RED — disc herniation or aortic
- Medicines: Ibuprofen, Diclofenac gel, 
  Thiocolchicoside, Paracetamol, Tramadol (severe)

PESTICIDE EXPOSURE:
- Always YELLOW or RED — never GREEN
- Organophosphate (most Punjab pesticides): 
  excessive saliva, pin-point pupils, muscle twitching
- IMMEDIATE: remove clothes, wash skin with soap 
  and water for 15 minutes, fresh air
- Call 108 immediately — this is a medical emergency
- Antidote: Atropine (hospital only)
- DO NOT induce vomiting
- Medicines: Atropine (hospital), Pralidoxime (hospital)
- RED urgency always

SNAKE/SCORPION BITE:
- Always RED — call 108 immediately
- Keep patient still and calm — movement spreads venom
- Remove tight clothing and jewelry near bite
- Do NOT cut, suck, or tourniquet the bite
- Anti-venom only at hospital (Civil Hospital Nabha 
  has anti-venom stock)
- Scorpion sting: Prazosin at hospital + pain relief
- Medicines: Paracetamol for pain only
- RED urgency always

HEAT STROKE:
- Body temp >104°F (40°C) + confusion = emergency
- Move to shade immediately, remove excess clothing
- Cool with wet cloth on neck, armpits, groin
- ORS or plain water if conscious
- Call 108 if confused, unconscious, or seizure
- Medicines: ORS, Paracetamol for temperature
- YELLOW if mild heat exhaustion, RED if confusion

EYE IRRITATION (STUBBLE BURNING):
- Saline eye wash or clean water irrigation immediately
- Sodium Cromoglicate eye drops 4 times daily
- Artificial tears (Carboxymethylcellulose drops) 
  every 2 hours
- Antihistamine: Olopatadine eye drops twice daily
- Avoid rubbing eyes
- If vision blurred or severe pain: YELLOW
- Medicines: Sodium Cromoglicate drops, 
  Olopatadine drops, Artificial tears, 
  Cetirizine oral tablet

MUSCLE CRAMPS (FARM LABOR):
- Dehydration + electrolyte loss — most common cause
- ORS sachets immediately + rest in shade
- Magnesium supplement: Magnesium 400mg daily
- Potassium-rich foods: banana, coconut water
- If severe or prolonged: Methocarbamol 750mg 
  or Thiocolchicoside 4mg
- Prevent: drink 3-4 litres water daily during farm work
- Medicines: ORS, Magnesium, 
  Thiocolchicoside, Calcium

WATERBORNE ILLNESS:
- Contaminated water: typhoid, cholera, hepatitis A
- ORS immediately for dehydration
- Typhoid suspected (fever + stomach pain 5+ days): 
  Azithromycin 500mg daily for 7 days or 
  Cefixime 200mg twice daily for 7-14 days
- Cholera (rice-water stools): ORS is life-saving, 
  Doxycycline 300mg single dose
- Hepatitis A (jaundice + dark urine): supportive only, 
  avoid Paracetamol — liver rest
- Medicines: ORS, Zinc, Azithromycin, 
  Cefixime, Doxycycline

━━━━━━━━━━━━━━━━━━━━━━━━━
LOCAL RESOURCES (always mention in RECOMMENDED ACTION):
━━━━━━━━━━━━━━━━━━━━━━━━━
- Civil Hospital Nabha — free OPD and emergency
- Jan Aushadhi store Nabha — generic medicines 
  up to 90% cheaper
- Rajindra Hospital Patiala — specialist referral
- 108 — free ambulance (24/7)
- Ayushman Bharat card — free treatment at 
  all government hospitals`;

  const userMessage = `Patient: ${patientType}
Symptoms: ${symptoms.join(", ")}
Duration: ${duration}
Location: Nabha, Punjab

Provide complete clinical assessment with all relevant 
medicines, exact doses and exact timings for these 
specific symptoms. Use the symptom protocols.
Respond in ${language}.`.trim();

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
                temperature: 0.15,
                maxOutputTokens: 2000
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
      max_tokens: 2000,
      temperature: 0.15,
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
