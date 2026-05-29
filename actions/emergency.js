"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { createNotification } from "@/actions/notifications";
import { pusherServer } from "@/lib/pusher";
import { revalidatePath } from "next/cache";

/**
 * Helper to verify if caller is an admin or owner
 */
async function verifyAdminOrOwner() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user || !["ADMIN", "OWNER"].includes(user.role)) {
    return null;
  }

  return user;
}

/**
 * Create a new emergency SOS request
 */
export async function createEmergencyRequest(latitude, longitude, address, message) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User profile not found");
    }

    const emergency = await db.emergencyRequest.create({
      data: {
        patientId: user.id,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        address: address || null,
        message: message || null,
        status: "ACTIVE",
      },
      include: {
        patient: true,
      },
    });

    // Create system notification for all ADMIN and OWNER roles
    const locationString = address || (latitude && longitude ? `${latitude}, ${longitude}` : "Unknown Location");
    const adminMessage = `🚨 EMERGENCY: ${user.name || "Patient"} needs help at ${locationString}`;

    try {
      const admins = await db.user.findMany({
        where: {
          role: { in: ["ADMIN", "OWNER"] },
        },
      });

      for (const admin of admins) {
        await createNotification(admin.id, adminMessage, "SYSTEM").catch((err) =>
          console.error("Failed to write notification for admin:", err.message)
        );
      }
    } catch (notifErr) {
      console.error("Failed to query admins for notifications:", notifErr);
    }

    // Trigger Pusher real-time SOS event
    try {
      await pusherServer.trigger("emergency-channel", "new-emergency", {
        id: emergency.id,
        patientName: user.name || "Anonymous Patient",
        latitude: emergency.latitude,
        longitude: emergency.longitude,
        address: emergency.address,
        message: emergency.message,
        createdAt: emergency.createdAt.toISOString(),
      });
    } catch (pusherErr) {
      console.warn("Pusher SOS dispatch event failed:", pusherErr.message);
    }

    revalidatePath("/admin/emergency");
    return { success: true, id: emergency.id };
  } catch (error) {
    console.error("Failed to create emergency request:", error);
    throw new Error("Failed to create emergency request: " + error.message);
  }
}

/**
 * Get all active and responding emergencies
 */
export async function getActiveEmergencies() {
  const admin = await verifyAdminOrOwner();
  if (!admin) {
    throw new Error("Unauthorized access. Admin privileges required.");
  }

  try {
    const emergencies = await db.emergencyRequest.findMany({
      where: {
        status: { in: ["ACTIVE", "RESPONDING"] },
      },
      include: {
        patient: {
          select: {
            name: true,
            email: true,
            imageUrl: true,
            role: true,
            village: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { emergencies };
  } catch (error) {
    console.error("Failed to fetch active emergencies:", error);
    throw new Error("Failed to fetch active emergencies: " + error.message);
  }
}

/**
 * Update the status of an emergency request
 */
export async function updateEmergencyStatus(id, status) {
  const admin = await verifyAdminOrOwner();
  if (!admin) {
    throw new Error("Unauthorized access. Admin privileges required.");
  }

  try {
    const data = { status };
    if (status === "RESOLVED") {
      data.resolvedAt = new Date();
    }

    const updated = await db.emergencyRequest.update({
      where: { id },
      data,
      include: {
        patient: true,
      },
    });

    // Notify patient about status resolution or response
    let patientMessage = "";
    if (status === "RESPONDING") {
      patientMessage = `Your emergency SOS alert has been acknowledged. A health worker is responding now!`;
    } else if (status === "RESOLVED") {
      patientMessage = `Your emergency SOS alert has been marked as resolved. We hope you are safe.`;
    }

    if (patientMessage) {
      await createNotification(updated.patientId, patientMessage, "SYSTEM").catch((err) =>
        console.error("Failed to notify patient:", err.message)
      );

      // Trigger user-specific Pusher alert to update patient client states
      try {
        await pusherServer.trigger(`user-${updated.patientId}`, "appointment-updated", {
          appointmentId: updated.id,
          status,
          message: patientMessage,
        });
      } catch (pusherErr) {
        console.warn("Pusher notification for SOS status failed:", pusherErr.message);
      }
    }

    revalidatePath("/admin/emergency");
    return { success: true, emergency: updated };
  } catch (error) {
    console.error("Failed to update emergency status:", error);
    throw new Error("Failed to update status: " + error.message);
  }
}
