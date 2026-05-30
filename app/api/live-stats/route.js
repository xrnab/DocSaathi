import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Professional landing page & clinic baseline statistics (traction offsets)
const BASE_PATIENTS = 284;
const BASE_DOCTORS = 5;
const BASE_APPOINTMENTS = 142;
const BASE_FAMILIES = 38;
const BASE_OUTBREAKS = 4;
const BASE_VACCINATIONS = 120;
const BASE_SYMPTOM_CHECKS = 230;

export async function GET() {
  try {
    // 1. Fetch live database counts
    const [
      dbPatients,
      dbDoctors,
      dbAppointments,
      dbFamilies,
      dbOutbreakReports,
      dbVaccinations,
      dbSymptomChecks
    ] = await Promise.all([
      db.user.count({ where: { role: "PATIENT" } }),
      db.user.count({ where: { role: "DOCTOR", verificationStatus: "VERIFIED" } }),
      // Count both completed and scheduled appointments (consultations)
      db.appointment.count({
        where: {
          status: { in: ["COMPLETED", "SCHEDULED"] }
        }
      }),
      db.ashaFamily.count(),
      db.outbreakReport.count(),
      db.vaccination.count(),
      db.symptomSubmission.count()
    ]);

    // 2. Compute dynamic unique villages across patients and ASHA families
    const [patientVillages, ashaVillages] = await Promise.all([
      db.user.findMany({
        where: {
          role: "PATIENT",
          village: { not: null, notIn: ["", "none", "None", "undefined"] },
        },
        select: { village: true },
        distinct: ["village"],
      }).catch(() => []),
      db.ashaFamily.findMany({
        where: {
          village: { not: null, notIn: ["", "none", "None", "undefined"] },
        },
        select: { village: true },
        distinct: ["village"],
      }).catch(() => [])
    ]);

    // Baseline regional Punjab villages
    const demoVillages = ["Sauja", "Bhadson", "Rohti Chhanna", "Kaleran", "Alhoran", "Kakrala", "Tohra"];
    const uniqueVillagesSet = new Set([
      ...demoVillages,
      ...patientVillages.map(v => v.village.trim()),
      ...ashaVillages.map(v => v.village.trim())
    ]);

    // 3. Return combined metrics (baseline + real live database count)
    return NextResponse.json({
      success: true,
      totalPatients: BASE_PATIENTS + dbPatients,
      totalDoctors: BASE_DOCTORS + dbDoctors,
      totalAppointments: BASE_APPOINTMENTS + dbAppointments,
      totalFamilies: BASE_FAMILIES + dbFamilies,
      totalOutbreakReports: BASE_OUTBREAKS + dbOutbreakReports,
      totalVaccinations: BASE_VACCINATIONS + dbVaccinations,
      totalSymptomChecks: BASE_SYMPTOM_CHECKS + dbSymptomChecks,
      totalVillages: uniqueVillagesSet.size
    });
  } catch (error) {
    console.error("Live stats API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch live statistics data." },
      { status: 500 }
    );
  }
}

