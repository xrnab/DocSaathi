import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { sendAppointmentReminder } from "@/lib/mail";
import { addHours } from "date-fns";

export async function GET(request) {
  try {
    // 1. Basic security check: x-cron-secret matching env var CRON_SECRET
    const authHeader = request.headers.get("x-cron-secret");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized access — invalid cron secret key." }, { status: 401 });
    }

    const now = new Date();
    const limitTime = addHours(now, 24);

    // 2. Find matching scheduled appointments lacking reminders
    const appointments = await db.appointment.findMany({
      where: {
        status: "SCHEDULED",
        reminderSent: false,
        startTime: {
          gte: now,
          lte: limitTime,
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

    let sentCount = 0;

    // 3. For each appointment, trigger reminder email & set reminderSent = true
    for (const appointment of appointments) {
      if (appointment.patient?.email) {
        await sendAppointmentReminder(appointment, false);
        
        await db.appointment.update({
          where: { id: appointment.id },
          data: { reminderSent: true },
        });
        
        sentCount++;
      }
    }

    return NextResponse.json({ success: true, sent: sentCount });
  } catch (error) {
    console.error("Error running send-reminders API route:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during reminders dispatch." },
      { status: 500 }
    );
  }
}
