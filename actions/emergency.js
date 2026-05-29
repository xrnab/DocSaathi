"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { createNotification } from "@/actions/notifications";
import { pusherServer } from "@/lib/pusher";
import { revalidatePath } from "next/cache";

/**
 * Helper to verify if caller is an admin, owner, or ASHA worker
 */
async function verifyAdminOrOwnerOrAsha() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user || !["ADMIN", "OWNER", "ASHA_WORKER"].includes(user.role)) {
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

    // Create system notification for all ADMIN, OWNER, and ASHA_WORKER roles
    const locationString = address || (latitude && longitude ? `${latitude}, ${longitude}` : "Unknown Location");
    const emergencyMessage = `🚨 EMERGENCY: ${user.name || "Patient"} needs help at ${locationString}`;

    try {
      const staffMembers = await db.user.findMany({
        where: {
          role: { in: ["ADMIN", "OWNER", "ASHA_WORKER"] },
        },
      });

      for (const staff of staffMembers) {
        await createNotification(staff.id, emergencyMessage, "SYSTEM").catch((err) =>
          console.error("Failed to write notification for staff:", err.message)
        );
      }
    } catch (notifErr) {
      console.error("Failed to query staff for notifications:", notifErr);
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
  const staff = await verifyAdminOrOwnerOrAsha();
  if (!staff) {
    throw new Error("Unauthorized access. Privilege check failed.");
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
        assignedDoctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
          }
        }
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
  const staff = await verifyAdminOrOwnerOrAsha();
  if (!staff) {
    throw new Error("Unauthorized access. Privilege check failed.");
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
        assignedDoctor: true,
      },
    });

    // Notify patient about status resolution or response
    let patientMessage = "";
    if (status === "RESPONDING") {
      patientMessage = `Your emergency SOS alert has been acknowledged. A responder is coordinate-tracking now!`;
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

    // Trigger Pusher update on emergency channel to refresh administrative views
    try {
      await pusherServer.trigger("emergency-channel", "emergency-assigned", {
        id: updated.id,
        status: updated.status,
        assignedDoctor: updated.assignedDoctor,
      });
    } catch (err) {
      console.warn("Failed to broadcast SOS update over Pusher:", err.message);
    }

    revalidatePath("/admin/emergency");
    return { success: true, emergency: updated };
  } catch (error) {
    console.error("Failed to update emergency status:", error);
    throw new Error("Failed to update status: " + error.message);
  }
}

/**
 * Assign/direct a verified doctor to an active emergency
 */
export async function assignDoctorToEmergency(emergencyId, doctorId) {
  const staff = await verifyAdminOrOwnerOrAsha();
  if (!staff) {
    throw new Error("Unauthorized access. Privilege check failed.");
  }

  try {
    const emergency = await db.emergencyRequest.findUnique({
      where: { id: emergencyId },
      include: { patient: true },
    });

    if (!emergency) {
      throw new Error("Emergency request not found");
    }

    const doctor = await db.user.findUnique({
      where: { id: doctorId },
    });

    if (!doctor || doctor.role !== "DOCTOR") {
      throw new Error("Target doctor not found or invalid role");
    }

    // Update emergency: link doctor and mark status as RESPONDING if active
    const updated = await db.emergencyRequest.update({
      where: { id: emergencyId },
      data: {
        assignedDoctorId: doctorId,
        status: emergency.status === "ACTIVE" ? "RESPONDING" : emergency.status,
      },
      include: {
        patient: true,
        assignedDoctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
          }
        }
      }
    });

    // Create system notification for doctor
    const locationString = updated.address || (updated.latitude && updated.longitude ? `${updated.latitude}, ${updated.longitude}` : "Unknown Location");
    const doctorAlertMessage = `🚨 CRITICAL SOS DIRECTIVE: You have been assigned to assist patient ${updated.patient.name || "Patient"} immediately at ${locationString}. Notes: ${updated.message || "None"}`;

    await createNotification(doctorId, doctorAlertMessage, "SYSTEM").catch((err) =>
      console.error("Failed to write directive notification for doctor:", err.message)
    );

    // Notify doctor in real-time
    try {
      await pusherServer.trigger(`user-${doctorId}`, "appointment-updated", {
        appointmentId: updated.id,
        status: "RESPONDING",
        message: doctorAlertMessage,
      });
    } catch (pusherErr) {
      console.warn("Pusher notification for SOS directive to doctor failed:", pusherErr.message);
    }

    // Trigger update on general emergency channel for live dashboards
    try {
      await pusherServer.trigger("emergency-channel", "emergency-assigned", {
        id: updated.id,
        status: updated.status,
        assignedDoctor: updated.assignedDoctor,
      });
    } catch (err) {
      console.warn("Failed to broadcast SOS directive over Pusher:", err.message);
    }

    revalidatePath("/admin/emergency");
    return { success: true, emergency: updated };
  } catch (error) {
    console.error("Failed to assign doctor to emergency:", error);
    throw new Error("Failed to assign doctor: " + error.message);
  }
}
