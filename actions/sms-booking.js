"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/actions/notifications";
import { format } from "date-fns";

import { getAvailableTimeSlots } from "./appointments";

/**
 * Formats a Date object into a timezone-aware (Asia/Kolkata) string for SMS.
 */
function formatSmsDateTime(date) {
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' };
  let timeStr = date.toLocaleTimeString('en-US', timeOptions);
  timeStr = timeStr.replace(/\s+/g, ' ');

  if (isToday) {
    return `today at ${timeStr}`;
  } else if (isTomorrow) {
    return `tomorrow at ${timeStr}`;
  } else {
    const dateOptions = { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' };
    const dateStr = date.toLocaleDateString('en-US', dateOptions);
    return `on ${dateStr} at ${timeStr}`;
  }
}

/**
 * Parses and processes a simulated SMS booking message
 * @param {string} messageText - The SMS text received
 * @param {object} currentState - Current conversation state
 */
export async function processIncomingSMS(messageText, currentState = null) {
  const { userId } = await auth();
  if (!userId) {
    return {
      reply: "DocSaathi: Unauthorized. Please log in.",
      success: false,
      newState: null
    };
  }

  const query = messageText.trim().toUpperCase();
  const isDbAvailable = !!process.env.DATABASE_URL;

  try {
    let user = null;
    if (isDbAvailable) {
      user = await db.user.findUnique({
        where: { clerkUserId: userId },
      });
    }

    if (isDbAvailable && !user) {
      return {
        reply: "DocSaathi: User profile not found. Complete onboarding first.",
        success: false,
        newState: null
      };
    }

    // --- STEP 1: Search / Initial ---
    if (query.startsWith("DOCTOR") || query.includes("FEVER") || query.includes("NABHA") || (!currentState && !["1", "2", "3", "4", "5"].includes(query))) {
      let doctors = [];
      
      if (isDbAvailable) {
        doctors = await db.user.findMany({
          where: { role: "DOCTOR", verificationStatus: "VERIFIED" },
          take: 3,
        });
      }

      // Fallback to demo doctors if DB is empty or missing
      if (doctors.length === 0) {
        const demoDoctors = [
          { id: "demo-1", name: "Dr. Amritpal Singh", specialty: "Fever Specialist" },
          { id: "demo-2", name: "Dr. Preeti Kaur", specialty: "General Physician" }
        ];
        return {
          reply: `DocSaathi (SIMULATED): Found 2 specialists in Nabha:\n1. ${demoDoctors[0].name}\n2. ${demoDoctors[1].name}\nReply with number.`,
          success: true,
          newState: { step: "SELECT_DOCTOR", doctorIds: demoDoctors.map(d => d.id), isDemo: true }
        };
      }

      let replyText = `DocSaathi Nabha: Found ${doctors.length} specialist(s):\n`;
      doctors.forEach((doc, idx) => {
        replyText += `${idx + 1}. ${doc.name} (${doc.specialty || "General"})\n`;
      });
      replyText += "Reply with doctor number.";

      return {
        reply: replyText,
        success: true,
        newState: { step: "SELECT_DOCTOR", doctorIds: doctors.map(d => d.id) }
      };
    }

    // --- STEP 2: Doctor Selection -> Slots ---
    if (currentState?.step === "SELECT_DOCTOR") {
      const selectionIndex = parseInt(query, 10) - 1;
      
      // Handle Demo Mode
      if (currentState.isDemo) {
        const demoSlots = [
          { id: "slot-1", time: "10:00 AM", date: "Tomorrow" },
          { id: "slot-2", time: "11:30 AM", date: "Tomorrow" }
        ];
        const docName = selectionIndex === 0 ? "Dr. Amritpal Singh" : "Dr. Preeti Kaur";
        return {
          reply: `Available slots for ${docName}:\n1. ${demoSlots[0].date} at ${demoSlots[0].time}\n2. ${demoSlots[1].date} at ${demoSlots[1].time}\nReply with slot number.`,
          success: true,
          newState: { ...currentState, step: "SELECT_SLOT", doctorName: docName, slotIds: demoSlots.map(s => s.id), slotTimes: demoSlots.map(s => s.time) }
        };
      }

      if (isNaN(selectionIndex) || selectionIndex < 0 || selectionIndex >= currentState.doctorIds.length) {
        return { reply: "DocSaathi: Invalid selection.", success: false, newState: currentState };
      }

      const doctorId = currentState.doctorIds[selectionIndex];
      const doctor = await db.user.findUnique({ where: { id: doctorId } });
      if (!doctor) {
        return { reply: "DocSaathi: Doctor not found.", success: false, newState: null };
      }

      const { days } = await getAvailableTimeSlots(doctorId);
      
      // Flatten all slots across the next 4 days
      const allSlots = [];
      days.forEach(d => {
        d.slots.forEach(slot => {
          allSlots.push(slot);
        });
      });

      const slotsToShow = allSlots.slice(0, 3);

      if (slotsToShow.length === 0) {
        return { reply: `DocSaathi: Dr. ${doctor.name} has no slots. Text 'DOCTOR' to restart.`, success: false, newState: null };
      }

      let replyText = `DocSaathi: Dr. ${doctor.name} is available at these times. Do you want to book?\n`;
      slotsToShow.forEach((s, i) => {
        const timeLabel = formatSmsDateTime(new Date(s.startTime));
        replyText += `${i + 1}. ${timeLabel}\n`;
      });
      replyText += "Reply with slot number to book.";

      return {
        reply: replyText,
        success: true,
        newState: { 
          step: "SELECT_SLOT", 
          doctorId, 
          doctorName: doctor.name, 
          slotIds: slotsToShow.map((s, idx) => `slot-${idx}`), 
          slotDetails: slotsToShow.map((s, idx) => ({ id: `slot-${idx}`, start: s.startTime, end: s.endTime })) 
        }
      };
    }

    // --- STEP 3: Slot Selection -> Finalize ---
    if (currentState?.step === "SELECT_SLOT") {
      const selectionIndex = parseInt(query, 10) - 1;

      // Handle Demo Mode Finalize
      if (currentState.isDemo) {
        const time = currentState.slotTimes[selectionIndex] || "10:00 AM";
        return {
          reply: `DocSaathi SUCCESS (SIMULATED): Appt with ${currentState.doctorName} confirmed for ${time}. Booking ID: SMS-DEMO`,
          success: true,
          newState: null
        };
      }

      const selectedSlot = currentState.slotDetails[selectionIndex];
      const APPOINTMENT_CREDIT_COST = 2;

      const bookResult = await db.$transaction(async (tx) => {
        const freshUser = await tx.user.findUnique({ where: { id: user.id } });
        
        // Give free credits for SMS demo if insufficient
        if (freshUser.credits < APPOINTMENT_CREDIT_COST) {
          await tx.user.update({
            where: { id: user.id },
            data: { credits: { increment: 10 } }
          });
          await tx.creditTransaction.create({
            data: { userId: user.id, amount: 10, type: "ADMIN_ADJUSTMENT" }
          });
        }

        // Deduct credits from patient
        await tx.user.update({
          where: { id: user.id },
          data: { credits: { decrement: APPOINTMENT_CREDIT_COST } }
        });

        await tx.creditTransaction.create({
          data: { userId: user.id, amount: -APPOINTMENT_CREDIT_COST, type: "APPOINTMENT_DEDUCTION" }
        });

        // Give credits to doctor
        await tx.user.update({
          where: { id: currentState.doctorId },
          data: { credits: { increment: APPOINTMENT_CREDIT_COST } }
        });

        await tx.creditTransaction.create({
          data: { userId: currentState.doctorId, amount: APPOINTMENT_CREDIT_COST, type: "APPOINTMENT_DEDUCTION" }
        });

        // Find the doctor's active daily availability slot and mark it as booked
        const activeAvailability = await tx.availability.findFirst({
          where: {
            doctorId: currentState.doctorId,
            status: "AVAILABLE"
          }
        });

        if (activeAvailability) {
          await tx.availability.update({
            where: { id: activeAvailability.id },
            data: { status: "BOOKED" }
          });
        }

        // Create appointment
        return tx.appointment.create({
          data: {
            patientId: user.id,
            doctorId: currentState.doctorId,
            startTime: new Date(selectedSlot.start),
            endTime: new Date(selectedSlot.end),
            patientDescription: `Booked via SMS Fallback Simulator.`,
            status: "SCHEDULED"
          }
        });
      });

      revalidatePath("/appointments");
      revalidatePath("/sms-demo");

      const formattedTimeLabel = formatSmsDateTime(new Date(selectedSlot.start));

      // Trigger real-time notifications in background
      try {
        const formattedTime = format(new Date(selectedSlot.start), "MMM d, h:mm a");
        createNotification(
          currentState.doctorId,
          `New appointment booked via SMS by ${user.name || "Patient"} for ${formattedTime}`,
          "APPOINTMENT"
        ).catch((err) => console.error("Failed to notify doctor:", err));

        createNotification(
          user.id,
          `Your consultation with Dr. ${currentState.doctorName} booked via SMS on ${formattedTime} is scheduled!`,
          "APPOINTMENT"
        ).catch((err) => console.error("Failed to notify patient:", err));
      } catch (notifyErr) {
        console.error("SMS booking notification failed:", notifyErr);
      }

      return {
        reply: `DocSaathi SUCCESS: Appt with Dr. ${currentState.doctorName} confirmed for ${formattedTimeLabel}. Booking ID: ${bookResult.id.substring(0,8)}`,
        appointmentId: bookResult.id,
        success: true,
        newState: null
      };
    }

    return { reply: "DocSaathi: Invalid command. Text 'DOCTOR' to start.", success: false, newState: null };

  } catch (error) {
    console.error("SMS Engine Error:", error);
    // Ultimate fallback for any DB connection error
    if (error.message.includes("DATABASE_URL") || error.code === "P1001") {
      return {
        reply: "DocSaathi: Database not connected. Entering SIMULATED demo mode.\n\nText 'DOCTOR' to see the mock flow.",
        success: true,
        newState: null
      };
    }
    return { reply: "DocSaathi: System error. Try again later.", success: false, newState: null };
  }
}

/**
 * Fetches all active/scheduled appointments booked for the currently logged-in patient
 */
export async function getSmsBookedAppointments() {
  const { userId } = await auth();
  if (!userId) return [];

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) return [];

    return await db.appointment.findMany({
      where: {
        patientId: user.id,
        status: "SCHEDULED",
        endTime: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // Keep active on the page until 30 minutes after scheduled end time
        },
      },
      include: {
        doctor: {
          select: {
            name: true,
            specialty: true,
          }
        }
      },
      orderBy: {
        startTime: "asc",
      }
    });
  } catch (error) {
    console.error("Failed to fetch SMS booked appointments:", error);
    return [];
  }
}
