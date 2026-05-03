"use server";

import { db } from "@/lib/prisma";

/**
 * Get doctors by specialty
 */
export async function getDoctorsBySpecialty(specialty, language = null) {
  try {
    const whereClause = {
      role: "DOCTOR",
      verificationStatus: "VERIFIED",
      specialty: specialty.split("%20").join(" "),
    };

    if (language) {
      whereClause.languages = {
        has: language,
      };
    }

    const doctors = await db.user.findMany({
      where: whereClause,
      orderBy: {
        name: "asc",
      },
    });

    return { doctors };
  } catch (error) {
    console.error("Failed to fetch doctors by specialty:", error);
    return { error: "Failed to fetch doctors" };
  }
}
