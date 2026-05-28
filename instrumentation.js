/**
 * Next.js 15 Server Instrumentation Startup Hook
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("🚀 Starting Next.js 15 Server Environment hooks...");
    try {
      const { startScheduler } = await import("./lib/scheduler");
      startScheduler();
    } catch (error) {
      console.error("❌ Failed to initialize background scheduler at server startup:", error);
    }
  }
}
