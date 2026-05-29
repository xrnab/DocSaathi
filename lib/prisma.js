import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
})

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}

export async function safeDbCall(fn) {
  try {
    return await fn()
  } catch (error) {
    if (error.code === "P1001") {
      console.error("Database unreachable:", error)
      return { error: "Database connection failed. Please try again." }
    }
    if (error.code === "P2025") {
      return { error: "Record not found." }
    }
    throw error
  }
}
