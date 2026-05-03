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
