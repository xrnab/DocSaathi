"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function getDoctorQueue() {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  try {
    const doctor = await db.user.findUnique({
      where: { clerkUserId: userId }
    });

    if (!doctor || doctor.role !== "DOCTOR") {
      return { error: "Access Denied. Doctors only." };
    }

    // Fetch today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await db.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: "SCHEDULED",
        startTime: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        patient: {
          include: {
            prescriptions: { where: { active: true } },
            patientAppointments: {
              where: { startTime: { lt: today }, status: "COMPLETED" },
              orderBy: { startTime: 'desc' },
              take: 5,
              include: { doctor: true }
            }
          }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    return { data: appointments };
  } catch (error) {
    console.error("Error fetching queue:", error);
    return { error: "Failed to fetch queue data" };
  }
}

export async function submitPrescription(data) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  try {
    if (!data.appointmentId) {
      return { error: "Appointment ID is required" };
    }

    const doctor = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!doctor || doctor.role !== "DOCTOR") {
      return { error: "Access Denied. Doctors only." };
    }

    const appointment = await db.appointment.findFirst({
      where: {
        id: data.appointmentId,
        doctorId: doctor.id,
        status: {
          in: ["SCHEDULED", "COMPLETED"],
        },
      },
    });

    if (!appointment) {
      return { error: "Patient is not in your consultation history." };
    }

    const newPrescription = await db.prescription.create({
      data: {
        patientId: appointment.patientId,
        name: data.name,
        dosage: data.dosage,
        frequency: data.frequency,
        duration: data.duration,
        active: true
      }
    });
    return { success: true, data: newPrescription };
  } catch (error) {
    console.error("Error saving prescription:", error);
    return { error: "Failed to save prescription" };
  }
}

export async function saveVoiceNote(appointmentId, transcript, fromRole) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId }
    });

    if (!user) {
      return { error: "User not found" };
    }

    const newVoiceNote = await db.voiceNote.create({
      data: {
        appointmentId,
        transcript,
        fromRole,
      }
    });

    return { success: true, data: newVoiceNote };
  } catch (error) {
    console.error("Error saving voice note:", error);
    return { error: "Failed to save voice note" };
  }
}

export async function generatePatientBriefing(appointmentId) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  try {
    const doctor = await db.user.findUnique({
      where: { clerkUserId: userId }
    });

    if (!doctor || doctor.role !== "DOCTOR") {
      return { error: "Access Denied. Doctors only." };
    }

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: {
            prescriptions: { where: { active: true } },
            patientAppointments: {
              where: { status: "COMPLETED" },
              orderBy: { startTime: "desc" },
              take: 3,
              include: { doctor: true }
            }
          }
        }
      }
    });

    if (!appointment) {
      return { error: "Appointment not found." };
    }

    const patient = appointment.patient;
    if (!patient) {
      return { error: "Patient profile not found." };
    }

    const activeMeds = patient.prescriptions.map(m => `- ${m.name}: ${m.dosage} (${m.frequency})`).join("\n") || "None";
    const pastVisits = patient.patientAppointments.map((app, idx) => {
      return `Visit #${idx + 1} (${new Date(app.startTime).toLocaleDateString()}): \nIssue: ${app.patientDescription || "N/A"}\nNotes: ${app.notes || "No clinical notes."}`;
    }).join("\n\n") || "No past Completed visits in record.";

    const contextString = `
Patient Info:
- Name: ${patient.name || "Unknown"}
- Age: ${patient.age || "N/A"} Yrs
- Gender: ${patient.gender || "N/A"}
- Blood Group: ${patient.bloodType || "N/A"}

Medical History:
${patient.medicalHistory || "None reported"}

Active Medications:
${activeMeds}

Allergies:
${patient.allergies || "None reported"}

Medications from History:
${patient.medications || "None reported"}

Last 3 Completed Consultation Visits:
${pastVisits}
`.trim();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return { error: "Pre-consultation briefing engine (Groq) is not configured on this server." };
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 800,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: "You are a clinical briefing assistant. Generate a concise pre-consultation doctor briefing in 4 sections: PATIENT SNAPSHOT (age, gender, blood type), ACTIVE CONDITIONS (from history + active meds), RECENT VISITS (last 3 appointments summary), RED FLAGS (allergies + anything critical to know). Keep each section to 2-3 bullet points. Be clinical and concise. Use these exact headers in your response: PATIENT SNAPSHOT, ACTIVE CONDITIONS, RECENT VISITS, and RED FLAGS. Do not use Markdown styling on the headers themselves."
          },
          {
            role: "user",
            content: contextString
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API Briefing Error response:", errorText);
      return { error: "Failed to generate AI clinical briefing." };
    }

    const resData = await response.json();
    const result = resData.choices[0]?.message?.content || "";

    return { success: true, briefing: result };
  } catch (error) {
    console.error("Error generating briefing:", error);
    return { error: error.message || "Failed to generate briefing." };
  }
}

export async function saveChatMessage(appointmentId, text, senderRole) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId }
    });

    if (!user) {
      return { error: "User not found" };
    }

    const message = await db.chatMessage.create({
      data: {
        appointmentId,
        text,
        senderRole,
      }
    });

    return { success: true, data: message };
  } catch (error) {
    console.error("Error saving chat message:", error);
    return { error: "Failed to save chat message" };
  }
}

export async function getChatMessages(appointmentId) {
  const { userId } = await auth();
  if (!userId) return [];

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId }
    });

    if (!user) return [];

    // Verify caller is a participant
    const appointment = await db.appointment.findFirst({
      where: {
        id: appointmentId,
        OR: [{ patientId: user.id }, { doctorId: user.id }]
      }
    });

    if (!appointment) return [];

    const messages = await db.chatMessage.findMany({
      where: { appointmentId },
      orderBy: { createdAt: "asc" }
    });

    return messages;
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return [];
  }
}
