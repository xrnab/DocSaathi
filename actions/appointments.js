"use server";

import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { Vonage } from "@vonage/server-sdk";
import {
  addDays,
  addMinutes,
  endOfDay,
  format,
  isBefore,
  isValid,
  subMinutes,
} from "date-fns";
import { Auth } from "@vonage/auth";

const APPOINTMENT_CREDIT_COST = 2;
const CALL_JOIN_WINDOW_MINUTES = 30;
const CALL_TOKEN_GRACE_MINUTES = 60;
const FALLBACK_VONAGE_KEY_PATH = path.join(process.cwd(), "lib", "private.key");

function getVonageApplicationId() {
  return (
    process.env.VONAGE_APPLICATION_ID ||
    process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID ||
    null
  );
}

function getVonagePrivateKey() {
  const envKey = process.env.VONAGE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (envKey?.trim()) {
    return envKey;
  }

  if (existsSync(FALLBACK_VONAGE_KEY_PATH)) {
    return readFileSync(FALLBACK_VONAGE_KEY_PATH, "utf8");
  }

  return null;
}

function getVonageClient() {
  const applicationId = getVonageApplicationId();
  const privateKey = getVonagePrivateKey();

  if (!applicationId || !privateKey) {
    throw new Error("Vonage video calling is not configured");
  }

  const credentials = new Auth({
    applicationId,
    privateKey,
  });

  return new Vonage(credentials, {});
}

function getCallWindow(appointment) {
  const appointmentStartTime = new Date(appointment.startTime);
  const appointmentEndTime = new Date(appointment.endTime);

  return {
    appointmentEndTime,
    joinWindowStart: subMinutes(
      appointmentStartTime,
      CALL_JOIN_WINDOW_MINUTES
    ),
    joinWindowEnd: addMinutes(appointmentEndTime, CALL_TOKEN_GRACE_MINUTES),
  };
}

function buildVonageConnectionData(user) {
  // Keep this short and consistent (token `data` has tight limits).
  const displayName =
    (typeof user?.name === "string" && user.name.trim()) ||
    (typeof user?.email === "string" && user.email.trim()) ||
    (user?.role === "DOCTOR" ? "Doctor" : "Patient");

  const payload = JSON.stringify({
    n: displayName.slice(0, 80),
    r: user?.role || "UNKNOWN",
    uid: user?.id || null,
  });

  return payload.length > 900 ? payload.slice(0, 900) : payload;
}

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
        const freshPatient = await tx.user.findUnique({
          where: {
            id: currentUser.id,
          },
          select: {
            id: true,
            credits: true,
          },
        });

        if (!freshPatient || freshPatient.credits < APPOINTMENT_CREDIT_COST) {
          throw new Error("Insufficient credits to book an appointment");
        }

        const overlappingAppointment = await tx.appointment.findFirst({
          where: {
            doctorId,
            status: "SCHEDULED",
            OR: [
              {
                startTime: {
                  lte: startTime,
                },
                endTime: {
                  gt: startTime,
                },
              },
              {
                startTime: {
                  lt: endTime,
                },
                endTime: {
                  gte: endTime,
                },
              },
              {
                startTime: {
                  gte: startTime,
                },
                endTime: {
                  lte: endTime,
                },
              },
            ],
          },
        });

        if (overlappingAppointment) {
          throw new Error("This time slot is already booked");
        }

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

        await tx.user.update({
          where: {
            id: currentUser.id,
          },
          data: {
            credits: {
              decrement: APPOINTMENT_CREDIT_COST,
            },
          },
        });

        await tx.user.update({
          where: {
            id: doctor.id,
          },
          data: {
            credits: {
              increment: APPOINTMENT_CREDIT_COST,
            },
          },
        });

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
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    revalidatePath("/appointments");
    revalidatePath("/doctor");
    revalidatePath("/telemedicine");
    return { success: true, appointment: appointment };
  } catch (error) {
    console.error("Failed to book appointment:", error);
    throw new Error("Failed to book appointment:" + error.message);
  }
}

/**
 * Generate a Vonage Video API session
 */
async function createVideoSession() {
  try {
    const vonage = getVonageClient();
    const session = await vonage.video.createSession({ mediaMode: "routed" });
    return session.sessionId;
  } catch (error) {
    throw new Error("Failed to create video session: " + error.message);
  }
}

/**
 * Resolve video-call credentials for a specific appointment
 */
export async function getVideoCallSession(appointmentId) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!appointmentId) {
      throw new Error("Appointment ID is required");
    }

    // Find the appointment and verify the user is part of it
    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
      },
      select: {
        id: true,
        patientId: true,
        doctorId: true,
        startTime: true,
        endTime: true,
        status: true,
        videoSessionId: true,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Verify the user is either the doctor or the patient for this appointment
    if (appointment.doctorId !== user.id && appointment.patientId !== user.id) {
      throw new Error("You are not authorized to join this call");
    }

    // Verify the appointment is scheduled
    if (appointment.status !== "SCHEDULED") {
      // If the appointment is not scheduled, do not issue tokens.
      return {
        success: true,
        callStatus: "EXPIRED",
        applicationId: getVonageApplicationId(),
        videoSessionId: appointment.videoSessionId || null,
        token: null,
        message: "This appointment is not currently scheduled",
      };
    }

    let videoSessionId = appointment.videoSessionId;

    if (!videoSessionId) {
      videoSessionId = await createVideoSession();

      await db.appointment.update({
        where: {
          id: appointment.id,
        },
        data: {
          videoSessionId,
        },
      });
    }

    const now = new Date();
    const { appointmentEndTime, joinWindowStart, joinWindowEnd } =
      getCallWindow(appointment);

    if (now < joinWindowStart) {
      return {
        success: true,
        callStatus: "PENDING",
        applicationId: getVonageApplicationId(),
        videoSessionId,
        token: null,
        joinWindowStart: joinWindowStart.toISOString(),
        joinWindowEnd: joinWindowEnd.toISOString(),
        message: `This call will go live ${CALL_JOIN_WINDOW_MINUTES} minutes before the scheduled time`,
      };
    }

    if (now > joinWindowEnd) {
      return {
        success: true,
        callStatus: "EXPIRED",
        applicationId: getVonageApplicationId(),
        videoSessionId,
        token: null,
        joinWindowStart: joinWindowStart.toISOString(),
        joinWindowEnd: joinWindowEnd.toISOString(),
        message: "This video call session has expired",
      };
    }

    const expirationTime =
      Math.floor(appointmentEndTime.getTime() / 1000) +
      CALL_TOKEN_GRACE_MINUTES * 60;

    const connectionData = buildVonageConnectionData(user);

    const vonage = getVonageClient();
    const token = vonage.video.generateClientToken(videoSessionId, {
      role: "publisher", // Both doctor and patient can publish streams
      expireTime: expirationTime,
      data: connectionData,
    });

    return {
      success: true,
      callStatus: "LIVE",
      applicationId: getVonageApplicationId(),
      videoSessionId,
      token,
      joinWindowStart: joinWindowStart.toISOString(),
      joinWindowEnd: joinWindowEnd.toISOString(),
    };
  } catch (error) {
    console.error("Failed to prepare video call session:", error);
    return {
      success: false,
      error: error.message || "Failed to prepare video call session",
    };
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
