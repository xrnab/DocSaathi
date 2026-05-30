"use server";

import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/actions/notifications";
import { getVideoCallSession, createVideoSession } from "@/lib/video";
import { sendAppointmentReminder } from "@/lib/mail";
import { pusherServer } from "@/lib/pusher";

const APPOINTMENT_CREDIT_COST = 2;
import {
  addDays,
  addMinutes,
  endOfDay,
  format,
  isBefore,
  isValid,
  subMinutes,
} from "date-fns";

const CALL_JOIN_WINDOW_MINUTES = 30;
const CALL_TOKEN_GRACE_MINUTES = 60;

function buildEmptyAvailabilityDays(now = new Date()) {
  const days = [now, addDays(now, 1), addDays(now, 2), addDays(now, 3)];

  return days.map((day) => ({
    date: format(day, "yyyy-MM-dd"),
    displayDate: format(day, "EEEE, MMMM d"),
    slots: [],
  }));
}

/**
 * Book a new appointment with a doctor
 */
export async function bookAppointment(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const currentUser = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!currentUser) {
      throw new Error("Please complete your profile before booking an appointment");
    }

    if (currentUser.role === "UNASSIGNED") {
      throw new Error(
        "Please complete your profile as a patient before booking an appointment"
      );
    }

    if (!["PATIENT", "ADMIN"].includes(currentUser.role)) {
      throw new Error("Only patient or admin accounts can book appointments");
    }

    // Parse form data
    const doctorId = formData.get("doctorId");
    const startTime = new Date(formData.get("startTime"));
    const endTime = new Date(formData.get("endTime"));
    const patientDescription = formData.get("description") || null;

    // Validate input
    if (!doctorId || !isValid(startTime) || !isValid(endTime)) {
      throw new Error("Doctor, start time, and end time are required");
    }

    if (startTime >= endTime) {
      throw new Error("Appointment end time must be after start time");
    }

    // Check if the doctor exists and is verified
    const doctor = await db.user.findFirst({
      where: {
        id: doctorId,
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found or not verified");
    }

    // Create a new Vonage Video API session
    const sessionId = await createVideoSession();

    const appointment = await db.$transaction(
      async (tx) => {
        // Lock: check if slot is still available inside the transaction
        const conflictingAppointment = await tx.appointment.findFirst({
          where: {
            doctorId,
            status: { in: ["SCHEDULED"] },
            OR: [
              { startTime: { gte: startTime, lt: endTime } },
              { endTime: { gt: startTime, lte: endTime } },
              { startTime: { lte: startTime }, endTime: { gte: endTime } }
            ]
          }
        });

        if (conflictingAppointment) {
          throw new Error(
            "This slot was just booked by another patient. " +
            "Please select a different time."
          );
        }

        // Also verify the Availability slot is still AVAILABLE
        const slot = await tx.availability.findFirst({
          where: {
            doctorId,
            status: "AVAILABLE"
          }
        });

        if (!slot) {
          throw new Error(
            "This time slot is no longer available. " +
            "Please refresh and choose another slot."
          );
        }

        // Mark slot as BOOKED atomically
        await tx.availability.update({
          where: { id: slot.id },
          data: { status: "BOOKED" }
        });

        // Deduct credits atomically
        const updatedUser = await tx.user.update({
          where: { id: currentUser.id },
          data: { credits: { decrement: APPOINTMENT_CREDIT_COST } }
        });

        if (updatedUser.credits < 0) {
          throw new Error("Insufficient credits to book this appointment.");
        }

        // Add credits atomically to doctor
        await tx.user.update({
          where: { id: doctor.id },
          data: { credits: { increment: APPOINTMENT_CREDIT_COST } }
        });

        // Create transaction records
        await tx.creditTransaction.create({
          data: {
            userId: currentUser.id,
            amount: -APPOINTMENT_CREDIT_COST,
            type: "APPOINTMENT_DEDUCTION",
          },
        });

        await tx.creditTransaction.create({
          data: {
            userId: doctor.id,
            amount: APPOINTMENT_CREDIT_COST,
            type: "APPOINTMENT_DEDUCTION",
          },
        });

        // Create the appointment
        return tx.appointment.create({
          data: {
            patientId: currentUser.id,
            doctorId: doctor.id,
            startTime,
            endTime,
            patientDescription,
            status: "SCHEDULED",
            videoSessionId: sessionId,
          },
          include: { doctor: true, patient: true }
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    revalidatePath("/appointments");
    revalidatePath("/doctor");
    revalidatePath("/telemedicine");

    // Trigger real-time notifications in background
    const formattedTime = format(new Date(startTime), "MMM d, h:mm a");
    createNotification(
      doctor.id,
      `New appointment booked by ${currentUser.name || "Patient"} for ${formattedTime}`,
      "APPOINTMENT"
    ).catch(err => console.error("Failed to notify doctor:", err));

    createNotification(
      currentUser.id,
      `Your appointment with Dr. ${doctor.name} on ${formattedTime} has been scheduled and confirmed!`,
      "APPOINTMENT"
    ).catch(err => console.error("Failed to notify patient:", err));

    // Send immediate email confirmation via Resend
    sendAppointmentReminder({
      patient: {
        name: currentUser.name,
        email: currentUser.email,
      },
      doctor: {
        name: doctor.name,
        specialty: doctor.specialty,
      },
      startTime: appointment.startTime,
      endTime: appointment.endTime
    }, true).catch(err => console.error("Failed to send booking confirmation email:", err));

    // Trigger real-time slot invalidation via Pusher
    try {
      await pusherServer.trigger(
        `doctor-${doctorId}`,
        "slot-booked",
        {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          doctorId
        }
      );
    } catch (pusherErr) {
      console.warn("Pusher slot update failed:", pusherErr.message);
    }

    return { success: true, appointment: appointment };
  } catch (error) {
    console.error("Failed to book appointment:", error);
    if (error instanceof Error && (
      error.message.includes("just booked") || 
      error.message.includes("no longer available") ||
      error.message.includes("Insufficient credits")
    )) {
      return { error: error.message };
    }
    return { error: "Failed to book appointment: " + error.message };
  }
}

/**
 * Backwards-compatible action wrapper used by existing clients
 */
export async function generateVideoToken(formData) {
  const appointmentId = formData.get("appointmentId");
  const result = await getVideoCallSession(appointmentId);

  if (!result.success) {
    throw new Error(result.error || "Failed to generate video token");
  }

  return result;
}

/**
 * Get doctor by ID
 */
export async function getDoctorById(doctorId) {
  try {
    const doctor = await db.user.findFirst({
      where: {
        id: doctorId,
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    return { doctor };
  } catch (error) {
    console.error("Failed to fetch doctor:", error);
    throw new Error("Failed to fetch doctor details");
  }
}

/**
 * Get available time slots for booking for the next 4 days
 */
export async function getAvailableTimeSlots(doctorId) {
  try {
    // Validate doctor existence and verification
    const doctor = await db.user.findFirst({
      where: {
        id: doctorId,
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found or not verified");
    }

    // Fetch a single availability record
    const availability = await db.availability.findFirst({
      where: {
        doctorId: doctor.id,
        status: "AVAILABLE",
      },
    });

    if (!availability) {
      return {
        days: buildEmptyAvailabilityDays(),
      };
    }

    // Get the next 4 days
    const now = new Date();
    const days = [now, addDays(now, 1), addDays(now, 2), addDays(now, 3)];

    // Fetch existing appointments for the doctor over the next 4 days
    const lastDay = endOfDay(days[3]);
    const existingAppointments = await db.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: "SCHEDULED",
        startTime: {
          lte: lastDay,
        },
      },
    });

    const availableSlotsByDay = {};

    // For each of the next 4 days, generate available slots
    for (const day of days) {
      const dayString = format(day, "yyyy-MM-dd");
      availableSlotsByDay[dayString] = [];

      // Create a copy of the availability start/end times for this day
      const availabilityStart = new Date(availability.startTime);
      const availabilityEnd = new Date(availability.endTime);

      // Set the day to the current day we're processing
      availabilityStart.setFullYear(
        day.getFullYear(),
        day.getMonth(),
        day.getDate()
      );
      availabilityEnd.setFullYear(
        day.getFullYear(),
        day.getMonth(),
        day.getDate()
      );

      let current = new Date(availabilityStart);
      const end = new Date(availabilityEnd);

      while (
        isBefore(addMinutes(current, 30), end) ||
        +addMinutes(current, 30) === +end
      ) {
        const next = addMinutes(current, 30);

        // Skip past slots
        if (isBefore(current, now)) {
          current = next;
          continue;
        }

        const overlaps = existingAppointments.some((appointment) => {
          const aStart = new Date(appointment.startTime);
          const aEnd = new Date(appointment.endTime);

          return (
            (current >= aStart && current < aEnd) ||
            (next > aStart && next <= aEnd) ||
            (current <= aStart && next >= aEnd)
          );
        });

        if (!overlaps) {
          availableSlotsByDay[dayString].push({
            startTime: current.toISOString(),
            endTime: next.toISOString(),
            formatted: `${format(current, "h:mm a")} - ${format(
              next,
              "h:mm a"
            )}`,
            day: format(current, "EEEE, MMMM d"),
          });
        }

        current = next;
      }
    }

    // Convert to array of slots grouped by day for easier consumption by the UI
    const result = Object.entries(availableSlotsByDay).map(([date, slots]) => {
      const parsedDate = new Date(`${date}T00:00:00`);

      return {
        date,
        displayDate:
          slots.length > 0
            ? slots[0].day
            : format(parsedDate, "EEEE, MMMM d"),
        slots,
      };
    });

    return { days: result };
  } catch (error) {
    console.error("Failed to fetch available slots:", error);
    throw new Error("Failed to fetch available time slots: " + error.message);
  }
}

export async function getAppointmentDetails(appointmentId) {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) return null;
  const appointment = await db.appointment.findFirst({
    where: {
      id: appointmentId,
      OR: [{ patientId: user.id }, { doctorId: user.id }]
    },
    include: {
      doctor: { select: { name: true, specialty: true, imageUrl: true } },
      patient: { select: { name: true, imageUrl: true } }
    }
  });
  return appointment;
}

