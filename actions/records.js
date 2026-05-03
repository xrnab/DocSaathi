"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function getUserRole() {
  const { userId } = await auth();
  if (!userId) return null;
  
  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });
    return user?.role || null;
  } catch (error) {
    return null;
  }
}

export async function getPatientRecords(patientId = null) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  try {
    const currentUser = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true, role: true }
    });

    if (!currentUser) return { error: "User not found" };

    // If patientId is provided, check if current user is allowed to see it
    let targetId = patientId || currentUser.id;
    
    if (patientId && currentUser.role !== "ADMIN" && currentUser.role !== "OWNER") {
       // If doctor, verify clinical relationship
       if (currentUser.role === "DOCTOR") {
         const hasRelationship = await db.appointment.findFirst({
           where: {
             doctorId: currentUser.id,
             patientId: patientId,
           }
         });
         
         if (!hasRelationship) {
           return { error: "You are only authorized to view records of patients who have consulted with you." };
         }
       } else if (patientId !== currentUser.id) {
         // Patients can only see their own records
         return { error: "Unauthorized to view these records" };
       }
    }

    const user = await db.user.findUnique({
      where: { id: targetId },
      include: {
        patientAppointments: {
          include: { doctor: true },
          orderBy: { startTime: 'desc' }
        },
        prescriptions: true,
        vaccinations: true
      }
    });

    if (!user || user.role !== "PATIENT") {
      return { error: "Patient record not found" };
    }

    return { data: user };
  } catch (error) {
    console.error("Error fetching patient records:", error);
    return { error: "Failed to fetch records" };
  }
}

export async function getDoctorPatients() {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  try {
    const currentUser = await db.user.findUnique({
      where: { clerkUserId: userId }
    });

    if (!currentUser) return { error: "User not found" };

    let query = {};
    if (currentUser.role === "DOCTOR") {
      query = { doctorId: currentUser.id };
    } else if (currentUser.role !== "ADMIN" && currentUser.role !== "OWNER") {
      return { error: "Access denied" };
    }

    const appointments = await db.appointment.findMany({
      where: query,
      include: { patient: true },
      orderBy: { startTime: 'desc' }
    });

    // Extract unique patients with their latest visit
    const patientsMap = new Map();
    appointments.forEach(app => {
      if (!patientsMap.has(app.patientId)) {
        patientsMap.set(app.patientId, {
          id: app.patientId,
          name: app.patient.name,
          email: app.patient.email,
          imageUrl: app.patient.imageUrl,
          bloodType: app.patient.bloodType,
          lastVisit: app.startTime,
          totalVisits: 1
        });
      } else {
        patientsMap.get(app.patientId).totalVisits += 1;
      }
    });

    return { data: Array.from(patientsMap.values()) };
  } catch (error) {
    console.error("Error fetching doctor patients:", error);
    return { error: "Failed to fetch patients" };
  }
}
