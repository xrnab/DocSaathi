import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      totalFamilies,
      totalOutbreakReports,
      totalVaccinations,
      totalSymptomChecks
    ] = await Promise.all([
      db.user.count({ where: { role: "PATIENT" } }),
      db.user.count({ where: { role: "DOCTOR", verificationStatus: "VERIFIED" } }),
      db.appointment.count({ where: { status: "COMPLETED" } }),
      db.ashaFamily.count(),
      db.outbreakReport.count(),
      db.vaccination.count(),
      db.symptomSubmission.count()
    ]);

    return NextResponse.json({
      success: true,
      totalPatients,
      totalDoctors,
      totalAppointments,
      totalFamilies,
      totalOutbreakReports,
      totalVaccinations,
      totalSymptomChecks
    });
  } catch (error) {
    console.error("Live stats API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch live statistics data." },
      { status: 500 }
    );
  }
}
