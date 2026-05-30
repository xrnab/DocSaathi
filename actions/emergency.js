"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { createNotification } from "@/actions/notifications";
import { pusherServer } from "@/lib/pusher";
import { revalidatePath } from "next/cache";

/**
 * Helper to verify if caller is an admin, owner, ASHA worker, or doctor
 */
async function verifyAdminOrOwnerOrAshaOrDoctor() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user || !["ADMIN", "OWNER", "ASHA_WORKER", "DOCTOR"].includes(user.role)) {
    return null;
  }

  return user;
}

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
        ashaResolved: false,
        doctorResolved: false,
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
    revalidatePath("/emergency");
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
  const staff = await verifyAdminOrOwnerOrAshaOrDoctor();
  if (!staff) {
    throw new Error("Unauthorized access. Privilege check failed.");
  }

  try {
    // If doctor is calling, only return active/responding emergencies assigned to them
    const whereClause = {
      status: { in: ["ACTIVE", "RESPONDING"] },
    };

    if (staff.role === "DOCTOR") {
      whereClause.assignedDoctorId = staff.id;
    }

    const emergencies = await db.emergencyRequest.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
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
        },
        assignedAsha: {
          select: {
            id: true,
            name: true,
            block: true,
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
 * Update the status of an emergency request (Acknowledge / respond only)
 */
export async function updateEmergencyStatus(id, status) {
  const staff = await verifyAdminOrOwnerOrAsha();
  if (!staff) {
    throw new Error("Unauthorized access. Privilege check failed.");
  }

  if (status === "RESOLVED" && staff.role === "ASHA_WORKER") {
    throw new Error("ASHA Workers are not authorized to directly resolve emergency cases. They can only notify that they have reached the location and directed the doctor.");
  }

  try {
    const data = { status };
    if (status === "RESOLVED") {
      data.resolvedAt = new Date();
      data.ashaResolved = true;
      data.doctorResolved = true;
    }

    const updated = await db.emergencyRequest.update({
      where: { id },
      data,
      include: {
        patient: true,
        assignedDoctor: true,
        assignedAsha: true,
      },
    });

    let patientMessage = "";
    if (status === "RESPONDING") {
      patientMessage = `Your emergency SOS alert has been acknowledged. Responders are coordinate-tracking now!`;
    } else if (status === "RESOLVED") {
      patientMessage = `Your emergency SOS alert has been marked as resolved. We hope you are safe.`;
    }

    if (patientMessage) {
      await createNotification(updated.patientId, patientMessage, "SYSTEM").catch((err) =>
        console.error("Failed to notify patient:", err.message)
      );

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
        assignedAsha: updated.assignedAsha,
        ashaResolved: updated.ashaResolved,
        doctorResolved: updated.doctorResolved,
      });
    } catch (err) {
      console.warn("Failed to broadcast SOS update over Pusher:", err.message);
    }

    revalidatePath("/admin/emergency");
    revalidatePath("/emergency");
    return { success: true, emergency: updated };
  } catch (error) {
    console.error("Failed to update emergency status:", error);
    throw new Error("Failed to update status: " + error.message);
  }
}

/**
 * ASHA resolution action (ASHA has reached the place and checked in)
 */
export async function resolveEmergencyByAsha(id) {
  const staff = await verifyAdminOrOwnerOrAsha();
  if (!staff) {
    throw new Error("Unauthorized access. Privilege check failed.");
  }

  try {
    const updated = await db.emergencyRequest.update({
      where: { id },
      data: {
        ashaResolved: true,
        status: "RESPONDING" // Ensure status reflects active response
      },
      include: {
        patient: true,
        assignedDoctor: true,
        assignedAsha: true,
      }
    });

    // Notify patient
    const patientMsg = `ASHA health worker ${updated.assignedAsha?.name || "Responder"} has reached your location and directed the doctor!`;
    await createNotification(updated.patientId, patientMsg, "SYSTEM").catch((e) => console.error(e));

    try {
      await pusherServer.trigger(`user-${updated.patientId}`, "appointment-updated", {
        appointmentId: updated.id,
        status: "RESPONDING",
        message: patientMsg,
      });
    } catch (e) {
      console.warn(e);
    }

    // Notify assigned doctor if exists
    if (updated.assignedDoctorId) {
      const docMsg = `🚨 SOS UPDATE: ASHA worker ${updated.assignedAsha?.name || "Responder"} has reached the location of patient ${updated.patient?.name || "Patient"} and directed you for the emergency SOS response.`;
      await createNotification(updated.assignedDoctorId, docMsg, "SYSTEM").catch((e) => console.error("Failed to notify doctor:", e));
      try {
        await pusherServer.trigger(`user-${updated.assignedDoctorId}`, "appointment-updated", {
          appointmentId: updated.id,
          status: "RESPONDING",
          message: docMsg,
        });
      } catch (e) {
        console.warn(e);
      }
    }

    // Notify all system admins/owners
    const adminMsg = `🚨 SOS UPDATE: ASHA worker ${updated.assignedAsha?.name || "Responder"} has reached the location of patient ${updated.patient?.name || "Patient"} and directed the doctor.`;
    try {
      const admins = await db.user.findMany({
        where: {
          role: { in: ["ADMIN", "OWNER"] },
        },
      });
      for (const admin of admins) {
        await createNotification(admin.id, adminMsg, "SYSTEM").catch((e) => console.error("Failed to notify admin:", e));
        try {
          await pusherServer.trigger(`user-${admin.id}`, "appointment-updated", {
            appointmentId: updated.id,
            status: "RESPONDING",
            message: adminMsg,
          });
        } catch (e) {
          console.warn(e);
        }
      }
    } catch (adminErr) {
      console.error("Failed to notify admins of ASHA check-in:", adminErr);
    }

    // Notify Admins & Doctors in real-time
    try {
      await pusherServer.trigger("emergency-channel", "emergency-assigned", {
        id: updated.id,
        status: updated.status,
        assignedDoctor: updated.assignedDoctor,
        assignedAsha: updated.assignedAsha,
        ashaResolved: true,
        doctorResolved: updated.doctorResolved,
      });
    } catch (err) {
      console.warn(err);
    }

    revalidatePath("/admin/emergency");
    revalidatePath("/emergency");
    return { success: true, emergency: updated };
  } catch (error) {
    console.error("Failed to check-in ASHA resolved:", error);
    throw new Error("Failed to check-in ASHA: " + error.message);
  }
}

/**
 * Doctor resolution action (Doctor has conducted the operation / emergency)
 * Strictly enforces that ASHA must have checked in first (reached location).
 */
export async function resolveEmergencyByDoctor(id) {
  const doctor = await verifyAdminOrOwnerOrAshaOrDoctor();
  if (!doctor || !["DOCTOR", "ADMIN", "OWNER"].includes(doctor.role)) {
    throw new Error("Unauthorized. Doctor privileges required.");
  }

  try {
    const emergency = await db.emergencyRequest.findUnique({
      where: { id },
    });

    if (!emergency) {
      throw new Error("Emergency request not found");
    }

    if (!emergency.ashaResolved) {
      throw new Error("Strict Protocol Violation: ASHA worker must reach the location and direct the doctor from their end before the Doctor can conduct the final resolution.");
    }

    // If both are resolved, update overall status to RESOLVED
    const isFullyResolved = true; // since doctor is now clicking, and we checked ashaResolved is true
    const data = {
      doctorResolved: true,
    };

    if (isFullyResolved) {
      data.status = "RESOLVED";
      data.resolvedAt = new Date();
    }

    const updated = await db.emergencyRequest.update({
      where: { id },
      data,
      include: {
        patient: true,
        assignedDoctor: true,
        assignedAsha: true,
      }
    });

    // Notify patient
    const patientMsg = `Emergency situation successfully resolved. Your consultation/operation has been completed.`;
    await createNotification(updated.patientId, patientMsg, "SYSTEM").catch((e) => console.error(e));

    try {
      await pusherServer.trigger(`user-${updated.patientId}`, "appointment-updated", {
        appointmentId: updated.id,
        status: "RESOLVED",
        message: patientMsg,
      });
    } catch (e) {
      console.warn(e);
    }

    // Broadcast live update
    try {
      await pusherServer.trigger("emergency-channel", "emergency-assigned", {
        id: updated.id,
        status: updated.status,
        assignedDoctor: updated.assignedDoctor,
        assignedAsha: updated.assignedAsha,
        ashaResolved: updated.ashaResolved,
        doctorResolved: true,
      });
    } catch (err) {
      console.warn(err);
    }

    revalidatePath("/admin/emergency");
    revalidatePath("/emergency");
    return { success: true, emergency: updated };
  } catch (error) {
    console.error("Failed to complete doctor resolution:", error);
    throw new Error("Failed to complete doctor resolution: " + error.message);
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
        },
        assignedAsha: {
          select: {
            id: true,
            name: true,
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

    // Create system notification for patient
    const patientAlertMessage = `👨‍⚕️ SPECIALIST DIRECTIVE: Dr. ${doctor.name} (${doctor.specialty || "Specialist"}) has been assigned to your emergency request!`;
    await createNotification(updated.patientId, patientAlertMessage, "SYSTEM").catch((err) =>
      console.error("Failed to write notification for patient:", err.message)
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

    // Notify patient in real-time
    try {
      await pusherServer.trigger(`user-${updated.patientId}`, "appointment-updated", {
        appointmentId: updated.id,
        status: "RESPONDING",
        message: patientAlertMessage,
      });
    } catch (pusherErr) {
      console.warn("Pusher notification for SOS directive to patient failed:", pusherErr.message);
    }

    // Trigger update on general emergency channel for live dashboards
    try {
      await pusherServer.trigger("emergency-channel", "emergency-assigned", {
        id: updated.id,
        status: updated.status,
        assignedDoctor: updated.assignedDoctor,
        assignedAsha: updated.assignedAsha,
        ashaResolved: updated.ashaResolved,
        doctorResolved: updated.doctorResolved,
      });
    } catch (err) {
      console.warn("Failed to broadcast SOS directive over Pusher:", err.message);
    }

    revalidatePath("/admin/emergency");
    revalidatePath("/emergency");
    return { success: true, emergency: updated };
  } catch (error) {
    console.error("Failed to assign doctor to emergency:", error);
    throw new Error("Failed to assign doctor: " + error.message);
  }
}

/**
 * Assign/direct an ASHA worker to an active emergency (Admin/Owner only)
 */
export async function assignAshaToEmergency(emergencyId, ashaId) {
  const admin = await verifyAdminOrOwner();
  if (!admin) {
    throw new Error("Unauthorized access. Admin privileges required.");
  }

  try {
    const emergency = await db.emergencyRequest.findUnique({
      where: { id: emergencyId },
      include: { patient: true },
    });

    if (!emergency) {
      throw new Error("Emergency request not found");
    }

    const asha = await db.user.findUnique({
      where: { id: ashaId },
    });

    if (!asha || asha.role !== "ASHA_WORKER") {
      throw new Error("Target ASHA worker not found or invalid role");
    }

    const updated = await db.emergencyRequest.update({
      where: { id: emergencyId },
      data: {
        assignedAshaId: ashaId,
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
        },
        assignedAsha: {
          select: {
            id: true,
            name: true,
            block: true,
          }
        }
      }
    });

    // Notify ASHA worker
    const locationString = updated.address || (updated.latitude && updated.longitude ? `${updated.latitude}, ${updated.longitude}` : "Unknown Location");
    const ashaAlertMessage = `🚨 EMERGENCY DISPATCH DIRECTIVE: You have been assigned to coordinate-assist patient ${updated.patient.name || "Patient"} immediately at ${locationString}. Notes: ${updated.message || "None"}`;

    await createNotification(ashaId, ashaAlertMessage, "SYSTEM").catch((err) =>
      console.error("Failed to write directive notification for ASHA:", err.message)
    );

    // Create system notification for patient
    const patientAshaAlertMessage = `👩‍⚕️ ASHA WORKER DISPATCHED: Community worker ${asha.name} has been dispatched to coordinate your case at the scene.`;
    await createNotification(updated.patientId, patientAshaAlertMessage, "SYSTEM").catch((err) =>
      console.error("Failed to write ASHA notification for patient:", err.message)
    );

    // Notify ASHA in real-time
    try {
      await pusherServer.trigger(`user-${ashaId}`, "appointment-updated", {
        appointmentId: updated.id,
        status: "RESPONDING",
        message: ashaAlertMessage,
      });
    } catch (pusherErr) {
      console.warn("Pusher notification for SOS directive to ASHA failed:", pusherErr.message);
    }

    // Notify patient in real-time
    try {
      await pusherServer.trigger(`user-${updated.patientId}`, "appointment-updated", {
        appointmentId: updated.id,
        status: "RESPONDING",
        message: patientAshaAlertMessage,
      });
    } catch (pusherErr) {
      console.warn("Pusher notification for ASHA directive to patient failed:", pusherErr.message);
    }

    // Trigger update on general emergency channel for live dashboards
    try {
      await pusherServer.trigger("emergency-channel", "emergency-assigned", {
        id: updated.id,
        status: updated.status,
        assignedDoctor: updated.assignedDoctor,
        assignedAsha: updated.assignedAsha,
        ashaResolved: updated.ashaResolved,
        doctorResolved: updated.doctorResolved,
      });
    } catch (err) {
      console.warn("Failed to broadcast SOS directive over Pusher:", err.message);
    }

    revalidatePath("/admin/emergency");
    revalidatePath("/emergency");
    return { success: true, emergency: updated };
  } catch (error) {
    console.error("Failed to assign ASHA to emergency:", error);
    throw new Error("Failed to assign ASHA: " + error.message);
  }
}

/**
 * Fetch all registered ASHA workers (for Admin assignment)
 */
export async function getRegisteredAshas() {
  const admin = await verifyAdminOrOwner();
  if (!admin) {
    throw new Error("Unauthorized access. Admin privileges required.");
  }

  try {
    const ashas = await db.user.findMany({
      where: { role: "ASHA_WORKER" },
      select: {
        id: true,
        name: true,
        block: true,
        village: true,
      }
    });
    return { ashas };
  } catch (err) {
    console.error("Failed to fetch ASHA workers:", err);
    return { ashas: [] };
  }
}

/**
 * Get the latest active or responding emergency request for the current user (patient)
 */
export async function getLatestPatientEmergency() {
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

    const emergency = await db.emergencyRequest.findFirst({
      where: {
        patientId: user.id,
        status: { in: ["ACTIVE", "RESPONDING"] },
      },
      include: {
        assignedDoctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
          }
        },
        assignedAsha: {
          select: {
            id: true,
            name: true,
            block: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { emergency };
  } catch (error) {
    console.error("Failed to get patient emergency:", error);
    throw new Error("Failed to get emergency: " + error.message);
  }
}

