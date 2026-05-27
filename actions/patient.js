import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

/**
 * Get all appointments for the authenticated patient
 */
export async function getPatientAppointments() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!["PATIENT", "ADMIN"].includes(user.role)) {
      throw new Error(
        "Appointments are only available for patient or admin accounts"
      );
    }

    const appointments = await db.appointment.findMany({
      where: {
        patientId: user.id,
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
            imageUrl: true,
          },
        },
      },
    });

    // Custom sorting: SCHEDULED appointments at the top, sorted by startTime asc (nearest first).
    // Non-SCHEDULED appointments at the bottom, sorted by startTime desc (most recent first).
    const sortedAppointments = [...appointments].sort((a, b) => {
      if (a.status === "SCHEDULED" && b.status !== "SCHEDULED") return -1;
      if (a.status !== "SCHEDULED" && b.status === "SCHEDULED") return 1;
      
      const timeA = new Date(a.startTime).getTime();
      const timeB = new Date(b.startTime).getTime();
      
      if (a.status === "SCHEDULED") {
        return timeA - timeB; // Ascending for upcoming
      } else {
        return timeB - timeA; // Descending for past
      }
    });

    return { appointments: sortedAppointments };
  } catch (error) {
    console.error("Failed to get patient appointments:", error);
    return { error: "Failed to fetch appointments" };
  }
}
