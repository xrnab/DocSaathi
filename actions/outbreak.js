"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const NABHA_VILLAGES = ["Sauja", "Bhadson", "Nabha Central", "Kaul", "Chhintanwala"];
const SYMPTOMS_POOL = ["Fever", "Cough", "Diarrhea", "Vomiting", "Jaundice", "Rash"];

/**
 * Checks and retrieves epidemiological statistics and logs.
 */
export async function getOutbreakDashboardData() {
  try {
    // 1. Fetch all symptom submissions
    const submissions = await db.symptomSubmission.findMany({
      orderBy: { createdAt: "desc" },
    });

    // 2. Fetch formal OutbreakReports from ASHA workers
    const formalReports = await db.outbreakReport.findMany({
      include: {
        reportedBy: {
          select: { name: true, ashaId: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // 3. If real submissions count is 0, return a clean empty state object
    if (submissions.length === 0) {
      const villageStats = {};
      NABHA_VILLAGES.forEach(v => {
        villageStats[v] = { last48h: 0, prev48h: 0, total: 0 };
      });

      const chartTimeline = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toLocaleDateString([], { month: "short", day: "numeric" });
        chartTimeline.push({ date: dateStr, count: 0 });
      }

      return {
        submissions: [],
        formalReports: [],
        villageStats,
        symptomCounts: {},
        activeAlerts: [],
        chartTimeline,
        totalCount: 0
      };
    }

    // 5. Calculate epidemiological metrics
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const ninetySixHoursAgo = new Date(now.getTime() - 96 * 60 * 60 * 1000);

    // Grouping and calculations
    const villageStats = {};
    const symptomCounts = {};
    let activeAlerts = [];

    NABHA_VILLAGES.forEach(v => {
      villageStats[v] = { last48h: 0, prev48h: 0, total: 0 };
    });

    submissions.forEach(sub => {
      const v = sub.village || "Nabha Central";
      if (!villageStats[v]) {
        villageStats[v] = { last48h: 0, prev48h: 0, total: 0 };
      }

      villageStats[v].total++;
      
      const created = new Date(sub.createdAt);
      if (created >= fortyEightHoursAgo) {
        villageStats[v].last48h++;
      } else if (created >= ninetySixHoursAgo) {
        villageStats[v].prev48h++;
      }

      // Symptoms count
      sub.symptoms.forEach(sym => {
        symptomCounts[sym] = (symptomCounts[sym] || 0) + 1;
      });
    });

    // Spike Detection Engine (village spikes > 200% within 48 hours compared to previous 48h baseline)
    Object.entries(villageStats).forEach(([village, stat]) => {
      const baseline = stat.prev48h || 1; // avoid division by zero
      const spikeRatio = stat.last48h / baseline;

      // Spike triggers if last 48h count is at least 4 cases AND spikeRatio >= 2.0 (200% spike)
      if (stat.last48h >= 4 && spikeRatio >= 2.0) {
        const pctIncrease = Math.round((spikeRatio - 1) * 100);
        activeAlerts.push({
          village,
          last48h: stat.last48h,
          prev48h: stat.prev48h,
          increasePct: pctIncrease,
          severity: stat.last48h >= 10 ? "CRITICAL" : "WARNING",
          message: `Epidemiological alert triggered in ${village}. Symptom queries jumped ${pctIncrease}% within the last 48h (${stat.last48h} cases vs ${stat.prev48h} baseline).`
        });
      }
    });

    // 6. Format data for dynamic charts (past 7 days timeline)
    const chartTimeline = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString([], { month: "short", day: "numeric" });
      
      // Count submissions on this date
      const countOnDate = submissions.filter(sub => {
        const cDate = new Date(sub.createdAt);
        return cDate.getDate() === d.getDate() && cDate.getMonth() === d.getMonth() && cDate.getFullYear() === d.getFullYear();
      }).length;

      chartTimeline.push({ date: dateStr, count: countOnDate });
    }

    return {
      submissions,
      formalReports,
      villageStats,
      symptomCounts,
      activeAlerts,
      chartTimeline,
      totalCount: submissions.length
    };
  } catch (error) {
    console.error("Failed to compile epidemiological data:", error);
    throw new Error(error.message || "Failed to compile epidemiological surveillance logs");
  }
}

/**
 * Triggers a manual resolution of an alert
 */
export async function resolveOutbreakAlert(village) {
  try {
    // Simulated action for administrator clearing/deploying team to village
    revalidatePath("/admin/outbreak");
    return { success: true, message: `Medical Response Unit dispatched to ${village}.` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function submitSymptomReport(data) {
  const { symptoms, duration, patientType, language, village } = data;
  if (!symptoms || symptoms.length === 0) {
    throw new Error("Symptoms are required");
  }

  try {
    const submission = await db.symptomSubmission.create({
      data: {
        symptoms,
        duration: duration || "Today",
        patientType: patientType || "ADULT",
        language: language || "PA",
        village: village || "Nabha Central",
      },
    });

    revalidatePath("/admin/outbreak");
    return { success: true, submission };
  } catch (error) {
    console.error("Failed to submit symptoms:", error);
    throw new Error(error.message || "Failed to submit symptoms");
  }
}
