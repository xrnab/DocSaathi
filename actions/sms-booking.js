"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

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
 */
export async function processIncomingSMS(messageText, lastDocId = null) {
  const { userId } = await auth();
  if (!userId) {
    return {
      reply: "DocSaathi: Unauthorized. Please log in to link your basic phone number.",
      success: false
    };
  }

  const query = messageText.trim().toUpperCase();

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return {
        reply: "DocSaathi: User profile not found. Complete onboarding first.",
        success: false
      };
    }

    // 1. Command: DOCTOR FEVER NABHA or similar doctor searches
    if (query.startsWith("DOCTOR") || query.includes("FEVER") || query.includes("NABHA")) {
      const doctors = await db.user.findMany({
        where: {
          role: "DOCTOR",
          verificationStatus: "VERIFIED",
        },
        include: {
          availabilities: {
            where: {
              status: "AVAILABLE",
            },
            orderBy: {
              startTime: "asc",
            },
          }
        },
        take: 2,
      });

      if (doctors.length === 0) {
        // Fallback fake doctors if database is brand new
        return {
          reply: "DocSaathi Nabha: Found 1 specialist available today:\n1. Dr. Amritpal Singh (Fever/General) at 10:00 AM.\nReply '1' to confirm booking instantly.",
          doctorId: "demo-doc-amritpal",
          success: true
        };
      }

      let replyText = `DocSaathi Nabha: Found ${doctors.length} specialist(s) available today:\n`;
      doctors.forEach((doc, idx) => {
        let timeLabel = "today at 10:30 AM";
        if (doc.availabilities && doc.availabilities.length > 0) {
          timeLabel = formatSmsDateTime(doc.availabilities[0].startTime);
        }
        replyText += `${idx + 1}. ${doc.name} (${doc.specialty || "General"}) ${timeLabel}.\n`;
      });
      replyText += "Reply with the number (e.g. '1') to book instantly.";

      return {
        reply: replyText,
        doctorId: doctors[0].id,
        doctorList: doctors.map(d => ({ id: d.id, name: d.name })),
        success: true
      };
    }

    // 2. Command: Reply "1" or "2" to book
    if (query === "1" || query === "2") {
      const doctors = await db.user.findMany({
        where: {
          role: "DOCTOR",
          verificationStatus: "VERIFIED",
        },
        include: {
          availabilities: {
            where: {
              status: "AVAILABLE",
            },
            orderBy: {
              startTime: "asc",
            },
          }
        },
        take: 2,
      });

      let doctorToBook = null;
      let selectedSlot = null;
      if (doctors.length > 0) {
        const index = parseInt(query, 10) - 1;
        doctorToBook = doctors[index] || doctors[0];
        if (doctorToBook.availabilities && doctorToBook.availabilities.length > 0) {
          selectedSlot = doctorToBook.availabilities[0];
        }
      }

      const APPOINTMENT_CREDIT_COST = 2;

      // Setup booking times
      let startTime = new Date();
      startTime.setDate(startTime.getDate() + 1); // tomorrow
      startTime.setHours(10, 30, 0, 0); // 10:30 AM fallback
      let endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 11:00 AM fallback

      if (selectedSlot) {
        startTime = selectedSlot.startTime;
        endTime = selectedSlot.endTime;
      }

      let bookResult = null;

      if (doctorToBook) {
        // Run transactional booking
        bookResult = await db.$transaction(async (tx) => {
          const freshUser = await tx.user.findUnique({
            where: { id: user.id }
          });

          if (!freshUser) throw new Error("User not found");

          // Give free credits for SMS demo if insufficient
          if (freshUser.credits < APPOINTMENT_CREDIT_COST) {
            await tx.user.update({
              where: { id: user.id },
              data: { credits: { increment: 10 } }
            });
            await tx.creditTransaction.create({
              data: {
                userId: user.id,
                amount: 10,
                type: "ADMIN_ADJUSTMENT"
              }
            });
          }

          // Deduct credits from patient
          await tx.user.update({
            where: { id: user.id },
            data: { credits: { decrement: APPOINTMENT_CREDIT_COST } }
          });

          await tx.creditTransaction.create({
            data: {
              userId: user.id,
              amount: -APPOINTMENT_CREDIT_COST,
              type: "APPOINTMENT_DEDUCTION"
            }
          });

          // Give credits to doctor
          await tx.user.update({
            where: { id: doctorToBook.id },
            data: { credits: { increment: APPOINTMENT_CREDIT_COST } }
          });

          await tx.creditTransaction.create({
            data: {
              userId: doctorToBook.id,
              amount: APPOINTMENT_CREDIT_COST,
              type: "APPOINTMENT_DEDUCTION"
            }
          });

          // If a database slot exists, mark it as BOOKED
          if (selectedSlot) {
            await tx.availability.update({
              where: { id: selectedSlot.id },
              data: { status: "BOOKED" }
            });
          }

          // Create appointment
          return tx.appointment.create({
            data: {
              patientId: user.id,
              doctorId: doctorToBook.id,
              startTime,
              endTime,
              patientDescription: `Booked via SMS Fallback Booking Simulator. Command text received: '${messageText}'`,
              status: "SCHEDULED"
            }
          });
        });

        revalidatePath("/appointments");
        revalidatePath("/sms-demo");

        const formattedTimeLabel = formatSmsDateTime(startTime);

        return {
          reply: `DocSaathi SUCCESS: Consultation scheduled with ${doctorToBook.name} for ${formattedTimeLabel}. Video booth link SMS sent to ASHA worker. Booking ID: ${bookResult.id.substring(0,8)}`,
          success: true
        };
      } else {
        // Demo/Mock Fallback booking if database has no verified doctors yet
        return {
          reply: `DocSaathi SUCCESS: Demonstration booking confirmed with Dr. Amritpal Singh for tomorrow at 10:00 AM. (Seeded locally for presentation)`,
          success: true
        };
      }
    }

    // Default error SMS
    return {
      reply: "DocSaathi: Invalid command. Text 'DOCTOR FEVER NABHA' to discover specialists near you.",
      success: false
    };

  } catch (error) {
    console.error("SMS booking engine failed:", error);
    return {
      reply: `DocSaathi: Failed to process request. ${error.message || "Please check network connection."}`,
      success: false
    };
  }
}
