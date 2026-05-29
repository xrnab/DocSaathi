import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { sendAppointmentReminder } from "@/lib/mail";
import { addHours } from "date-fns";

export async function GET(request) {
  try {
    const headerSecret = request.headers.get("x-cron-secret");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || headerSecret !== cronSecret) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing cron secret" },
        { status: 401 }
      );
    }

    const now = new Date();
    const tomorrow = addHours(now, 24);

    // Find all scheduled appointments that require a reminder within 24 hours
    const appointments = await db.appointment.findMany({
      where: {
        status: "SCHEDULED",
        reminderSent: false,
        startTime: {
          gte: now,
          lte: tomorrow,
        },
      },
      include: {
        patient: {
          select: {
            name: true,
            email: true,
          },
        },
        doctor: {
          select: {
            name: true,
            specialty: true,
          },
        },
      },
    });

    const remindedIds = [];

    // Send emails one by one
    for (const appointment of appointments) {
      if (appointment.patient?.email) {
        try {
          await sendAppointmentReminder(appointment, false);
          remindedIds.push(appointment.id);
        } catch (mailErr) {
          console.error(`Failed to send reminder for appointment ${appointment.id}:`, mailErr);
        }
      }
    }

    // Batch update the reminderSent status to true
    if (remindedIds.length > 0) {
      await db.appointment.updateMany({
        where: {
          id: {
            in: remindedIds,
          },
        },
        data: {
          reminderSent: true,
        },
      });
    }

    return NextResponse.json({ success: true, sent: remindedIds.length });
  } catch (error) {
    console.error("Cron send-reminders execution failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
