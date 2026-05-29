"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/actions/notifications";
import { format } from "date-fns";

/**
 * Gets the current logged-in ASHA worker's user profile
 */
export async function getAshaWorkerProfile() {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user || user.role !== "ASHA_WORKER") {
      return null;
    }
    return user;
  } catch (error) {
    console.error("Failed to get ASHA worker profile:", error);
    return null;
  }
}

/**
 * Retrieves all families registered by this ASHA worker, including their members
 */
export async function getAshaFamilies() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const families = await db.ashaFamily.findMany({
      where: { ashaId: user.id },
      include: {
        members: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return families;
  } catch (error) {
    console.error("Failed to get ASHA families:", error);
    throw new Error(error.message || "Failed to fetch households");
  }
}

/**
 * Creates a new family household registry record
 */
export async function createAshaFamily(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const { headName, village, block, pincode } = data;
  if (!headName || !village || !block) {
    throw new Error("Head of household name, village, and block are required");
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const newFamily = await db.ashaFamily.create({
      data: {
        ashaId: user.id,
        headName,
        village,
        block,
        pincode: pincode || "",
      },
    });

    revalidatePath("/asha");
    return { success: true, family: newFamily };
  } catch (error) {
    console.error("Failed to create ASHA family:", error);
    throw new Error(error.message || "Failed to create household record");
  }
}

/**
 * Adds a new family member to a household registry
 */
export async function addAshaFamilyMember(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const { familyId, name, age, gender, relation, immunisations } = data;
  if (!familyId || !name || age === undefined || !gender || !relation) {
    throw new Error("All fields are required to register a family member");
  }

  try {
    const newMember = await db.ashaFamilyMember.create({
      data: {
        familyId,
        name,
        age: parseInt(age, 10),
        gender,
        relation,
        immunisations: immunisations || "",
      },
    });

    revalidatePath("/asha");
    return { success: true, member: newMember };
  } catch (error) {
    console.error("Failed to add ASHA family member:", error);
    throw new Error(error.message || "Failed to add family member");
  }
}

/**
 * Updates a family member's immunisation records
 */
export async function updateMemberImmunisations(memberId, immunisations) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const updatedMember = await db.ashaFamilyMember.update({
      where: { id: memberId },
      data: {
        immunisations,
      },
    });

    revalidatePath("/asha");
    return { success: true, member: updatedMember };
  } catch (error) {
    console.error("Failed to update immunisation record:", error);
    throw new Error(error.message || "Failed to update immunisations");
  }
}

/**
 * Creates an epidemiological outbreak early warning report
 */
export async function createOutbreakReport(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const { symptoms, village, block, caseCount, notes } = data;
  if (!symptoms || symptoms.length === 0 || !village || !block || caseCount === undefined) {
    throw new Error("Symptoms, village, block, and case count are required");
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const report = await db.outbreakReport.create({
      data: {
        reportedById: user.id,
        symptoms,
        village,
        block,
        caseCount: parseInt(caseCount, 10),
        notes: notes || "",
      },
    });

    // Seed corresponding symptom submissions to feed epidemiological dashboard
    for (let i = 0; i < parseInt(caseCount, 10); i++) {
      await db.symptomSubmission.create({
        data: {
          symptoms,
          duration: "1-3 days",
          patientType: "ALL_AGES",
          language: "PA",
          village,
        },
      });
    }

    revalidatePath("/asha");
    revalidatePath("/admin/outbreak");
    return { success: true, report };
  } catch (error) {
    console.error("Failed to create outbreak report:", error);
    throw new Error(error.message || "Failed to submit outbreak report");
  }
}

/**
 * Fetches all appointments proxy-booked by this ASHA worker
 */
export async function getAshaAppointments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const appointments = await db.appointment.findMany({
      where: {
        patientId: user.id,
      },
      include: {
        doctor: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return appointments;
  } catch (error) {
    console.error("Failed to fetch ASHA appointments:", error);
    throw new Error(error.message || "Failed to fetch appointments");
  }
}

/**
 * Gets all verified doctors in Nabha or general region
 */
export async function getVerifiedDoctors() {
  try {
    const doctors = await db.user.findMany({
      where: {
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
      },
      select: {
        id: true,
        name: true,
        specialty: true,
        experience: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    return doctors;
  } catch (error) {
    console.error("Failed to fetch verified doctors:", error);
    return [];
  }
}

/**
 * Proxy book appointment for a family member
 */
export async function bookAshaPatientAppointment(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const { doctorId, startTime, endTime, memberName, notes } = data;

  if (!doctorId || !startTime || !endTime || !memberName) {
    throw new Error("Doctor, time, and patient name are required");
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");
    if (user.role !== "ASHA_WORKER") throw new Error("Only ASHA workers can book using this action");

    const doctor = await db.user.findFirst({
      where: {
        id: doctorId,
        role: "DOCTOR",
        verificationStatus: "VERIFIED",
      },
    });

    if (!doctor) {
      throw new Error("Selected doctor is not available or not verified");
    }

    const APPOINTMENT_CREDIT_COST = 2;

    // Check availability overlap
    const overlap = await db.appointment.findFirst({
      where: {
        doctorId,
        status: "SCHEDULED",
        OR: [
          {
            startTime: { lte: new Date(startTime) },
            endTime: { gt: new Date(startTime) },
          },
          {
            startTime: { lt: new Date(endTime) },
            endTime: { gte: new Date(endTime) },
          },
        ],
      },
    });

    if (overlap) {
      throw new Error("This slot is already booked for this doctor");
    }

    // ASHA worker acts as patient ID in appointment.
    // We register in notes that this is on behalf of family member.
    const appointment = await db.$transaction(async (tx) => {
      // Check credits on ASHA worker (can give unlimited or check balance)
      const freshUser = await tx.user.findUnique({
        where: { id: user.id },
      });

      if (!freshUser) throw new Error("Worker profile not found");
      
      // If ASHA worker has less than 2 credits, give them +10 credits instantly (government allocation!)
      let currentCredits = freshUser.credits;
      if (currentCredits < APPOINTMENT_CREDIT_COST) {
        await tx.user.update({
          where: { id: user.id },
          data: { credits: { increment: 20 } },
        });
        currentCredits += 20;

        await tx.creditTransaction.create({
          data: {
            userId: user.id,
            amount: 20,
            type: "ADMIN_ADJUSTMENT",
          },
        });
      }

      // Deduct credits from ASHA worker
      await tx.user.update({
        where: { id: user.id },
        data: { credits: { decrement: APPOINTMENT_CREDIT_COST } },
      });

      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          amount: -APPOINTMENT_CREDIT_COST,
          type: "APPOINTMENT_DEDUCTION",
        },
      });

      // Increment credits for doctor
      await tx.user.update({
        where: { id: doctor.id },
        data: { credits: { increment: APPOINTMENT_CREDIT_COST } },
      });

      await tx.creditTransaction.create({
        data: {
          userId: doctor.id,
          amount: APPOINTMENT_CREDIT_COST,
          type: "APPOINTMENT_DEDUCTION",
        },
      });

      // Create appointment
      return tx.appointment.create({
        data: {
          patientId: user.id,
          doctorId: doctor.id,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          patientDescription: `Booked by ASHA Worker ${user.name} for family member: ${memberName}. Notes: ${notes || "None"}`,
          status: "SCHEDULED",
        },
      });
    });

    revalidatePath("/asha");

    // Trigger real-time notifications in background
    try {
      const formattedTime = format(new Date(startTime), "MMM d, h:mm a");
      createNotification(
        doctor.id,
        `New proxy appointment booked by ASHA Worker ${user.name || "ASHA Worker"} for member ${memberName} at ${formattedTime}`,
        "APPOINTMENT"
      ).catch((err) => console.error("Failed to notify doctor:", err));

      createNotification(
        user.id,
        `Proxy appointment for ${memberName} with Dr. ${doctor.name} at ${formattedTime} has been scheduled!`,
        "APPOINTMENT"
      ).catch((err) => console.error("Failed to notify ASHA worker:", err));
    } catch (notifyErr) {
      console.error("ASHA booking notification failed:", notifyErr);
    }

    return { success: true, appointment };
  } catch (error) {
    console.error("ASHA Proxy Book failed:", error);
    throw new Error(error.message || "Failed to book proxy appointment");
  }
}

export async function getAshaDashboardStats() {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user || user.role !== "ASHA_WORKER") return null;

    const [familiesCount, membersCount, outbreakReports, proxyAppointments] = await Promise.all([
      db.ashaFamily.count({ where: { ashaId: user.id } }).catch(() => 0),
      db.ashaFamilyMember.count({ where: { family: { ashaId: user.id } } }).catch(() => 0),
      db.outbreakReport.count({ where: { reportedById: user.id } }).catch(() => 0),
      db.appointment.count({
        where: {
          OR: [
            { patientDescription: { contains: "ASHA proxy" } },
            { patientDescription: { contains: "Booked by ASHA" } }
          ],
          doctorId: { not: user.id }
        }
      }).catch(() => 0),
    ]);

    return {
      familiesCount,
      membersCount,
      outbreakReports,
      proxyAppointments,
    };
  } catch (error) {
    console.error("Failed to get ASHA dashboard stats:", error);
    return null;
  }
}
