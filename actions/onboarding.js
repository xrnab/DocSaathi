"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { checkUser } from "@/lib/checkUser";

/**
 * Sets the user's role and related information
 */
export async function setUserRole(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Find user in our database
  let user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    user = await checkUser();
  }

  if (!user) throw new Error("User not found in database and could not be provisioned");

  const role = formData.get("role");

  if (!role || !["PATIENT", "DOCTOR", "ASHA_WORKER"].includes(role)) {
    throw new Error("Invalid role selection");
  }

  try {
    // For ASHA worker role
    if (role === "ASHA_WORKER") {
      const ashaId = formData.get("ashaId");
      const village = formData.get("village");
      const block = formData.get("block");
      const name = formData.get("name");

      if (!ashaId || !village || !block || !name) {
        throw new Error("All fields are required");
      }

      await db.user.update({
        where: {
          clerkUserId: userId,
        },
        data: {
          role: "ASHA_WORKER",
          name,
          village,
          block,
          ashaId,
          isProfileComplete: true,
        },
      });

      revalidatePath("/");
      return { success: true, redirect: "/asha" };
    }

    // For patient role - simple update
    if (role === "PATIENT") {
      await db.user.update({
        where: {
          clerkUserId: userId,
        },
        data: {
          role: "PATIENT",
        },
      });

      revalidatePath("/");
      return { success: true, redirect: "/patients/onboarding" };
    }

    // For doctor role - need additional information
    if (role === "DOCTOR") {
      const specialty = formData.get("specialty");
      const experience = parseInt(formData.get("experience"), 10);
      const credentialUrl = formData.get("credentialUrl");
      const description = formData.get("description");
      const languagesRaw = formData.get("languages");
      const languages = languagesRaw ? JSON.parse(languagesRaw) : [];

      // Validate inputs
      if (!specialty || !experience || !credentialUrl || !description || languages.length === 0) {
        throw new Error("All fields are required");
      }

      await db.user.update({
        where: {
          clerkUserId: userId,
        },
        data: {
          role: "DOCTOR",
          specialty,
          experience,
          credentialUrl,
          description,
          languages,
          gender: formData.get("gender"),
          verificationStatus: "PENDING",
        },
      });

      revalidatePath("/");
      return { success: true, redirect: "/doctor/verification" };
    }
  } catch (error) {
    console.error("Failed to set user role:", error);
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
}

/**
 * Updates the patient's medical profile
 */
export async function updatePatientMedicalProfile(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name");
  const age = parseInt(formData.get("age"), 10);
  const height = parseFloat(formData.get("height"));
  const weight = parseFloat(formData.get("weight"));
  const bloodType = formData.get("bloodType");
  const gender = formData.get("gender");
  const medicalHistory = formData.get("medicalHistory");
  const allergies = formData.get("allergies");
  const medications = formData.get("medications");
  const village = formData.get("village");

  try {
    await db.user.update({
      where: { clerkUserId: userId },
      data: {
        name,
        age,
        height,
        weight,
        bloodType,
        gender,
        medicalHistory,
        allergies,
        medications,
        village,
        isProfileComplete: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/patients");
    revalidatePath("/appointments");
    revalidatePath("/doctor");
    revalidatePath("/telemedicine");
    return { success: true };
  } catch (error) {
    console.error("Failed to update medical profile:", error);
    throw new Error(`Failed to update medical profile: ${error.message}`);
  }
}

/**
 * Gets the current user's complete profile information
 */
export async function getCurrentUser() {
  try {
    return await checkUser();
  } catch (error) {
    console.error("Failed to get user information:", error);
    return null;
  }
}
