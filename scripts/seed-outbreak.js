const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

const NABHA_VILLAGES = ["Sauja", "Bhadson", "Nabha Central", "Kaul", "Chhintanwala"];
const SYMPTOMS_POOL = ["Fever", "Cough", "Diarrhea", "Vomiting", "Jaundice", "Rash"];

async function main() {
  console.log("Seeding epidemiological outbreak surveillance logs...");
  
  const seedEntries = [];
  const now = new Date();

  // Seed baseline data spread across 7 days
  for (let i = 0; i < 45; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - Math.floor(Math.random() * 7) - 2); // 2 to 9 days ago

    const village = NABHA_VILLAGES[Math.floor(Math.random() * NABHA_VILLAGES.length)];
    // Ensure baseline is very low for Sauja
    const finalVillage = (village === "Sauja" && Math.random() > 0.3) ? "Nabha Central" : village;

    seedEntries.push({
      symptoms: [
        SYMPTOMS_POOL[Math.floor(Math.random() * SYMPTOMS_POOL.length)],
        Math.random() > 0.7 ? SYMPTOMS_POOL[Math.floor(Math.random() * SYMPTOMS_POOL.length)] : null
      ].filter(Boolean),
      duration: "1-3 days",
      patientType: Math.random() > 0.5 ? "ADULT" : "CHILD",
      language: Math.random() > 0.5 ? "PA" : "EN",
      village: finalVillage,
      createdAt: date
    });
  }

  // Seed a sharp SPIKE in "Sauja" within the last 48 hours
  // 15 cases of Fever and Diarrhea to trigger >200% spike alerts
  for (let i = 0; i < 15; i++) {
    const date = new Date(now);
    date.setHours(now.getHours() - Math.floor(Math.random() * 40)); // last 40 hours

    seedEntries.push({
      symptoms: ["Fever", "Diarrhea"],
      duration: "1-3 days",
      patientType: Math.random() > 0.5 ? "CHILD" : "ADULT",
      language: "PA",
      village: "Sauja",
      createdAt: date
    });
  }

  try {
    // Bulk create seeds
    await db.symptomSubmission.createMany({
      data: seedEntries,
    });
    console.log(`Successfully seeded ${seedEntries.length} realistic surveillance entries.`);
  } catch (error) {
    console.error("Error seeding outbreak data:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
