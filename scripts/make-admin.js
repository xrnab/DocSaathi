// Run this script with: node scripts/make-admin.js <your-email>
// Example: node scripts/make-admin.js arnab@example.com

const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error("❌ Please provide an email: node scripts/make-admin.js your@email.com");
    process.exit(1);
  }

  try {
    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      console.error(`❌ No user found with email: ${email}`);
      console.log("\nAll users in the database:");
      const allUsers = await db.user.findMany({ select: { email: true, name: true, role: true } });
      allUsers.forEach(u => console.log(`  - ${u.email} (${u.name}) [${u.role}]`));
      process.exit(1);
    }

    await db.user.update({
      where: { email },
      data: { role: "ADMIN" },
    });

    console.log(`✅ Successfully made ${user.name || email} an ADMIN!`);
    console.log(`   You can now access the admin panel at /admin`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await db.$disconnect();
  }
}

makeAdmin();
