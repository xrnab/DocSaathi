"use server"
import { db } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { addDays, differenceInWeeks, addWeeks } from "date-fns"

// Helper: calculate trimester from weeks
function getTrimester(weeks) {
  if (weeks <= 13) return 1
  if (weeks <= 26) return 2
  return 3
}

// Helper: generate standard reminders based on LMP
function generateReminders(pregnancyId, lmp, edd) {
  const reminders = []
  // ANC visits (standard schedule)
  reminders.push({
    pregnancyId, type: "ANC_VISIT", sent: false,
    dueDate: addWeeks(lmp, 12),
    title: "ANC 1st Visit Due",
    description: "First antenatal checkup — blood tests, BP, weight"
  })
  reminders.push({
    pregnancyId, type: "ANC_VISIT", sent: false,
    dueDate: addWeeks(lmp, 20),
    title: "ANC 2nd Visit Due",
    description: "Anomaly scan, hemoglobin check"
  })
  reminders.push({
    pregnancyId, type: "ANC_VISIT", sent: false,
    dueDate: addWeeks(lmp, 28),
    title: "ANC 3rd Visit Due",
    description: "Growth scan, diabetes screening"
  })
  reminders.push({
    pregnancyId, type: "ANC_VISIT", sent: false,
    dueDate: addWeeks(lmp, 36),
    title: "ANC 4th Visit Due",
    description: "Final checkup, delivery planning"
  })
  // TT vaccines
  reminders.push({
    pregnancyId, type: "TT_VACCINE", sent: false,
    dueDate: addWeeks(lmp, 16),
    title: "TT Vaccine 1 Due",
    description: "First tetanus toxoid injection"
  })
  reminders.push({
    pregnancyId, type: "TT_VACCINE", sent: false,
    dueDate: addWeeks(lmp, 20),
    title: "TT Vaccine 2 Due",
    description: "Second tetanus toxoid injection"
  })
  // Delivery prep
  reminders.push({
    pregnancyId, type: "DELIVERY_PREP", sent: false,
    dueDate: addWeeks(edd, -4),
    title: "Delivery Preparation",
    description: "Arrange transport, hospital bag, birth plan"
  })
  return reminders
}

// 1. Register a new pregnancy
export async function registerPregnancy(data) {
  const { userId } = await auth()
  if (!userId) return { error: "Unauthorized" }

  const user = await db.user.findUnique({ where: { clerkUserId: userId } })
  if (!user) return { error: "User not found" }

  const { lmpDate, ashaId, weight, bloodPressure, hemoglobin, patientId: passedPatientId } = data

  const lmp = new Date(lmpDate)
  const edd = addDays(lmp, 280)
  const weeksPregnant = differenceInWeeks(new Date(), lmp)
  const trimester = getTrimester(weeksPregnant)

  // Determine initial risk factors
  const riskFactors = []
  if (hemoglobin && hemoglobin < 10) riskFactors.push("Severe anemia (Hb < 10)")
  if (bloodPressure) {
    const [sys] = bloodPressure.split("/").map(Number)
    if (sys >= 140) riskFactors.push("High blood pressure")
  }
  if (weeksPregnant > 40) riskFactors.push("Post-term pregnancy")

  let targetPatientId = user.id
  let targetAshaId = ashaId || null

  if (user.role === "ASHA_WORKER") {
    if (!passedPatientId) return { error: "Patient ID is required for ASHA workers registering pregnancies" }
    targetPatientId = passedPatientId
    targetAshaId = user.id
  }

  try {
    const pregnancy = await db.pregnancyRecord.create({
      data: {
        patientId: targetPatientId,
        ashaId: targetAshaId,
        lmp, edd, trimester, weeksPregnant,
        weight: weight ? parseFloat(weight) : null,
        bloodPressure: bloodPressure || null,
        hemoglobin: hemoglobin ? parseFloat(hemoglobin) : null,
        isHighRisk: riskFactors.length > 0,
        riskFactors,
        status: "ACTIVE"
      }
    })

    // Generate standard reminders
    const reminderData = generateReminders(pregnancy.id, lmp, edd)
    await db.pregnancyReminder.createMany({ data: reminderData })

    revalidatePath("/pregnancy")
    revalidatePath("/asha")
    return { success: true, pregnancy }
  } catch (error) {
    console.error("Pregnancy registration error:", error)
    return { error: "Failed to register pregnancy" }
  }
}

// 2. Get current user's active pregnancy
export async function getMyPregnancy() {
  const { userId } = await auth()
  if (!userId) return { error: "Unauthorized" }

  const user = await db.user.findUnique({ where: { clerkUserId: userId } })
  if (!user) return null

  const pregnancy = await db.pregnancyRecord.findFirst({
    where: { patientId: user.id, status: "ACTIVE" },
    include: {
      ancVisits: { orderBy: { visitDate: "desc" } },
      reminders: {
        where: { sent: false, dueDate: { gte: new Date() } },
        orderBy: { dueDate: "asc" },
        take: 5
      },
      asha: { select: { name: true, ashaId: true, block: true } }
    }
  })

  if (!pregnancy) return null

  // Recalculate weeks (always fresh)
  const weeksPregnant = differenceInWeeks(new Date(), pregnancy.lmp)
  const trimester = getTrimester(weeksPregnant)

  return { ...pregnancy, weeksPregnant, trimester }
}

// 3. Get all pregnancies for ASHA worker
export async function getAshaPregnancies() {
  const { userId } = await auth()
  if (!userId) return { error: "Unauthorized" }

  const user = await db.user.findUnique({ where: { clerkUserId: userId } })
  if (!user || user.role !== "ASHA_WORKER") return { error: "Access denied" }

  const pregnancies = await db.pregnancyRecord.findMany({
    where: { ashaId: user.id, status: "ACTIVE" },
    include: {
      patient: { select: { name: true, village: true, age: true } },
      ancVisits: { orderBy: { visitDate: "desc" }, take: 1 },
      reminders: {
        where: { sent: false, dueDate: { lte: addDays(new Date(), 14) } },
        orderBy: { dueDate: "asc" }
      }
    },
    orderBy: { edd: "asc" }
  })

  return pregnancies.map(p => ({
    ...p,
    weeksPregnant: differenceInWeeks(new Date(), p.lmp),
    trimester: getTrimester(differenceInWeeks(new Date(), p.lmp)),
    daysUntilDue: Math.ceil((p.edd - new Date()) / (1000 * 60 * 60 * 24))
  }))
}

// 4. Log an ANC visit
export async function logANCVisit(pregnancyId, visitData) {
  const { userId } = await auth()
  if (!userId) return { error: "Unauthorized" }

  const {
    visitNumber, visitDate, weight, bloodPressure,
    hemoglobin, bloodSugar, fundalHeight, fetalHeartRate, notes
  } = visitData

  // Determine new risk factors
  const riskFactors = []
  if (hemoglobin && parseFloat(hemoglobin) < 10)
    riskFactors.push("Severe anemia (Hb < 10)")
  if (hemoglobin && parseFloat(hemoglobin) < 7)
    riskFactors.push("Critical anemia — needs transfusion")
  if (bloodPressure) {
    const [sys, dia] = bloodPressure.split("/").map(Number)
    if (sys >= 140 || dia >= 90) riskFactors.push("Hypertension")
    if (sys >= 160) riskFactors.push("Severe hypertension — urgent")
  }
  if (bloodSugar && parseFloat(bloodSugar) > 140)
    riskFactors.push("Gestational diabetes risk")
  if (fetalHeartRate && (fetalHeartRate < 110 || fetalHeartRate > 160))
    riskFactors.push("Abnormal fetal heart rate")

  try {
    // Create the ANC visit record
    const visit = await db.aNCVisit.create({
      data: {
        pregnancyId,
        visitNumber: parseInt(visitNumber),
        visitDate: new Date(visitDate),
        weight: weight ? parseFloat(weight) : null,
        bloodPressure: bloodPressure || null,
        hemoglobin: hemoglobin ? parseFloat(hemoglobin) : null,
        bloodSugar: bloodSugar ? parseFloat(bloodSugar) : null,
        fundalHeight: fundalHeight ? parseFloat(fundalHeight) : null,
        fetalHeartRate: fetalHeartRate ? parseInt(fetalHeartRate) : null,
        notes: notes || null,
      }
    })

    // Update pregnancy record with latest vitals + risk
    await db.pregnancyRecord.update({
      where: { id: pregnancyId },
      data: {
        weight: weight ? parseFloat(weight) : undefined,
        bloodPressure: bloodPressure || undefined,
        hemoglobin: hemoglobin ? parseFloat(hemoglobin) : undefined,
        bloodSugar: bloodSugar ? parseFloat(bloodSugar) : undefined,
        isHighRisk: riskFactors.length > 0,
        riskFactors,
        updatedAt: new Date()
      }
    })

    revalidatePath("/pregnancy")
    revalidatePath("/asha")
    return { success: true, visit, newRisks: riskFactors }
  } catch (error) {
    console.error("ANC visit error:", error)
    return { error: "Failed to log ANC visit" }
  }
}

// 5. AI risk assessment using Groq
export async function generatePregnancyRiskAssessment(pregnancyId) {
  const { userId } = await auth()
  if (!userId) return { error: "Unauthorized" }

  const pregnancy = await db.pregnancyRecord.findUnique({
    where: { id: pregnancyId },
    include: {
      patient: { select: { name: true, age: true, medicalHistory: true } },
      ancVisits: { orderBy: { visitDate: "desc" }, take: 3 }
    }
  })

  if (!pregnancy) return { error: "Pregnancy record not found" }

  const weeks = differenceInWeeks(new Date(), pregnancy.lmp)

  const context = `
Pregnant patient: Age ${pregnancy.patient.age || "unknown"}, 
${weeks} weeks pregnant (Trimester ${getTrimester(weeks)}),
EDD: ${pregnancy.edd.toLocaleDateString()},
Latest vitals — Weight: ${pregnancy.weight || "?"}kg, 
BP: ${pregnancy.bloodPressure || "?"}, 
Hemoglobin: ${pregnancy.hemoglobin || "?"}g/dL,
Blood Sugar: ${pregnancy.bloodSugar || "?"}mg/dL,
Current risk flags: ${pregnancy.riskFactors.join(", ") || "None"},
Medical history: ${pregnancy.patient.medicalHistory || "None"},
ANC visits completed: ${pregnancy.ancVisits.length}
  `.trim()

  const apiKey = process.env.GROQ_API_KEY
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 600,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `You are a maternal health AI for rural India.
Respond ONLY in this JSON format, no markdown:
{
  "overallRisk": "LOW|MEDIUM|HIGH|CRITICAL",
  "immediateActions": ["action1", "action2"],
  "watchFor": ["warning sign 1", "warning sign 2"],
  "nutritionTips": ["tip1", "tip2", "tip3"],
  "nextSteps": "one paragraph of guidance",
  "referToHospital": true or false
}`
          },
          { role: "user", content: context }
        ]
      })
    }
  )

  const data = await response.json()
  let text = data.choices[0]?.message?.content || "{}"
  text = text.replace(/```json|```/g, "").trim()

  try {
    return { success: true, assessment: JSON.parse(text) }
  } catch {
    return { error: "Could not generate assessment" }
  }
}

// 6. Search PATIENT users by name
export async function searchPatientsForPregnancy(query) {
  const { userId } = await auth()
  if (!userId) return { error: "Unauthorized" }

  try {
    const patients = await db.user.findMany({
      where: {
        role: "PATIENT",
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        village: true,
        age: true,
      },
      take: 10,
    });
    return { success: true, patients };
  } catch (error) {
    console.error("Patient search error:", error);
    return { error: "Failed to search patients" };
  }
}
