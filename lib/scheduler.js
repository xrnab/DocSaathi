import cron from "node-cron";
import { db } from "./prisma";
import { createNotification } from "../actions/notifications";

export function startScheduler() {
  console.log("⏰ DocSaathi Background Scheduler Initialized.");

  // Run a cron job every minute
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000);

    try {
      // Find SCHEDULED appointments starting in the next 30 minutes that haven't sent a reminder
      const appointments = await db.appointment.findMany({
        where: {
          status: "SCHEDULED",
          reminderSent: false,
          startTime: {
            gte: now,
            lte: thirtyMinutesLater,
          },
        },
        include: {
          patient: true,
          doctor: true,
        },
      });

      if (appointments.length > 0) {
        console.log(`[Scheduler] Found ${appointments.length} upcoming appointments starting in under 30 minutes.`);
      }

      for (const appointment of appointments) {
        // Send Pusher notification to patient
        await createNotification(
          appointment.patientId,
          `Your appointment with Dr. ${appointment.doctor.name} starts in 30 minutes!`,
          "REMINDER"
        );

        // Send Pusher notification to doctor
        await createNotification(
          appointment.doctorId,
          `Your consultation with ${appointment.patient.name || "Patient"} starts in 30 minutes!`,
          "REMINDER"
        );

        // Update appointment: reminderSent = true
        await db.appointment.update({
          where: { id: appointment.id },
          data: { reminderSent: true },
        });

        console.log(`[Scheduler] Successfully sent 30-minute reminders for appointment ID: ${appointment.id}`);
      }
    } catch (error) {
      console.error("[Scheduler] Error in background cron job:", error);
    }
  });
}
