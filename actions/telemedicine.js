"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { pusherServer } from "@/lib/pusher";

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

/**
 * Join telemedicine queue for a scheduled appointment
 */
export async function joinQueue(appointmentId) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId }
    });

    if (!user) return { error: "User profile not found" };

    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true }
    });

    if (!appointment) return { error: "Appointment not found" };
    if (appointment.patientId !== user.id && user.role !== "ADMIN") {
      return { error: "Access Denied. You do not own this appointment." };
    }

    // Get or create doctor's queue settings
    const queue = await db.doctorQueue.upsert({
      where: { doctorId: appointment.doctorId },
      update: {
        totalTokens: { increment: 1 }
      },
      create: {
        doctorId: appointment.doctorId,
        totalTokens: 1,
        isActive: true
      }
    });

    const assignedToken = queue.totalTokens + 1; // Since update runs first, or we incremented it

    // Update appointment with assigned queue token
    const currentToken = queue.currentToken;
    const position = Math.max(0, assignedToken - currentToken - 1);
    const estimatedWait = position * queue.avgMinutes;

    const updatedAppointment = await db.appointment.update({
      where: { id: appointmentId },
      data: {
        queueToken: assignedToken,
        queuePosition: position
      }
    });

    // Notify Pusher channel about patient joining
    try {
      await pusherServer.trigger(`queue-${appointment.doctorId}`, "patient-joined", {
        token: assignedToken,
        patientName: user.name || "Anonymous Patient"
      });
    } catch (pushErr) {
      console.warn("Pusher trigger failed in joinQueue:", pushErr.message);
    }

    return {
      success: true,
      token: assignedToken,
      position,
      estimatedWait,
      currentToken: queue.currentToken
    };
  } catch (error) {
    console.error("Error joining queue:", error);
    return { error: "Failed to join queue: " + error.message };
  }
}

/**
 * Get queue status for doctor
 */
export async function getQueueStatus(doctorId) {
  try {
    const queue = await db.doctorQueue.findUnique({
      where: { doctorId }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await db.appointment.findMany({
      where: {
        doctorId,
        status: "SCHEDULED",
        queueToken: { not: null },
        startTime: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        patient: {
          select: { name: true }
        }
      },
      orderBy: {
        queueToken: "asc"
      }
    });

    return {
      success: true,
      currentToken: queue?.currentToken || 0,
      totalTokens: queue?.totalTokens || 0,
      avgMinutes: queue?.avgMinutes || 10,
      isActive: queue?.isActive || false,
      queue: appointments.map(app => ({
        id: app.id,
        token: app.queueToken,
        patientName: app.patient?.name || "Anonymous Patient",
        position: Math.max(0, (app.queueToken || 0) - (queue?.currentToken || 0) - 1)
      }))
    };
  } catch (error) {
    console.error("Error fetching queue status:", error);
    return { error: "Failed to fetch queue status" };
  }
}

/**
 * Call the next patient in queue
 */
export async function callNextPatient(doctorId) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  try {
    const doctor = await db.user.findUnique({
      where: { clerkUserId: userId }
    });

    if (!doctor || doctor.role !== "DOCTOR" || doctor.id !== doctorId) {
      return { error: "Access Denied. Doctors only." };
    }

    const queue = await db.doctorQueue.findUnique({
      where: { doctorId }
    });

    if (!queue) {
      return { error: "No active queue found for this doctor" };
    }

    const newCurrentToken = queue.currentToken + 1;

    // Update serving token
    await db.doctorQueue.update({
      where: { doctorId },
      data: { currentToken: newCurrentToken }
    });

    // Find next patient's appointment with this token today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextAppointment = await db.appointment.findFirst({
      where: {
        doctorId,
        queueToken: newCurrentToken,
        startTime: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        patient: true
      }
    });

    // Notify Pusher channel that token has been called
    try {
      await pusherServer.trigger(`queue-${doctorId}`, "token-called", {
        token: newCurrentToken
      });

      if (nextAppointment && nextAppointment.patient) {
        await pusherServer.trigger(`user-${nextAppointment.patientId}`, "your-turn", {
          message: "It's your turn! Join the video call now."
        });
      }
    } catch (pushErr) {
      console.warn("Pusher trigger failed in callNextPatient:", pushErr.message);
    }

    return {
      success: true,
      calledToken: newCurrentToken,
      patientName: nextAppointment?.patient?.name || null
    };
  } catch (error) {
    console.error("Error calling next patient:", error);
    return { error: "Failed to call next patient: " + error.message };
  }
}

/**
 * Toggle queue active status
 */
export async function toggleQueueActive(doctorId, isActive) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  try {
    const doctor = await db.user.findUnique({
      where: { clerkUserId: userId }
    });

    if (!doctor || doctor.role !== "DOCTOR" || doctor.id !== doctorId) {
      return { error: "Access Denied." };
    }

    const queue = await db.doctorQueue.upsert({
      where: { doctorId },
      update: { isActive },
      create: { doctorId, isActive }
    });

    // Notify Pusher channel about queue status change
    try {
      await pusherServer.trigger(`queue-${doctorId}`, "queue-active-changed", { isActive });
    } catch (e) {}

    return { success: true, isActive: queue.isActive };
  } catch (error) {
    console.error("Error toggling queue:", error);
    return { error: "Failed to toggle queue" };
  }
}
