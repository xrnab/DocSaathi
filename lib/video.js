import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Vonage } from "@vonage/server-sdk";
import { Auth } from "@vonage/auth";
import { subMinutes, addMinutes } from "date-fns";

const CALL_JOIN_WINDOW_MINUTES = 30;
const CALL_TOKEN_GRACE_MINUTES = 30;
const FALLBACK_VONAGE_KEY_PATH = path.join(process.cwd(), "lib", "private.key");

function getVonageApplicationId() {
  return (
    process.env.VONAGE_APPLICATION_ID ||
    process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID ||
    null
  );
}

function getVonagePrivateKey() {
  const envKey = process.env.VONAGE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (envKey?.trim()) {
    return envKey;
  }

  if (existsSync(FALLBACK_VONAGE_KEY_PATH)) {
    return readFileSync(FALLBACK_VONAGE_KEY_PATH, "utf8");
  }

  return null;
}

function getVonageClient() {
  const applicationId = getVonageApplicationId();
  const privateKey = getVonagePrivateKey();

  if (!applicationId || !privateKey) {
    throw new Error("Vonage video calling is not configured");
  }

  const credentials = new Auth({
    applicationId,
    privateKey,
  });

  return new Vonage(credentials, {});
}

function getCallWindow(appointment) {
  const appointmentStartTime = new Date(appointment.startTime);
  const appointmentEndTime = new Date(appointment.endTime);

  return {
    appointmentEndTime,
    joinWindowStart: subMinutes(
      appointmentStartTime,
      CALL_JOIN_WINDOW_MINUTES
    ),
    joinWindowEnd: addMinutes(appointmentEndTime, CALL_TOKEN_GRACE_MINUTES),
  };
}

function buildVonageConnectionData(user) {
  const displayName =
    (typeof user?.name === "string" && user.name.trim()) ||
    (typeof user?.email === "string" && user.email.trim()) ||
    (user?.role === "DOCTOR" ? "Doctor" : "Patient");

  const payload = JSON.stringify({
    n: displayName.slice(0, 80),
    r: user?.role || "UNKNOWN",
    uid: user?.id || null,
  });

  return payload.length > 900 ? payload.slice(0, 900) : payload;
}

export async function createVideoSession() {
  try {
    const vonage = getVonageClient();
    const session = await vonage.video.createSession({ mediaMode: "routed" });
    return session.sessionId;
  } catch (error) {
    throw new Error("Failed to create video session: " + error.message);
  }
}

export async function getVideoCallSession(appointmentId) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!appointmentId) {
      throw new Error("Appointment ID is required");
    }

    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
      },
      select: {
        id: true,
        patientId: true,
        doctorId: true,
        startTime: true,
        endTime: true,
        status: true,
        videoSessionId: true,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    if (appointment.doctorId !== user.id && appointment.patientId !== user.id) {
      throw new Error("You are not authorized to join this call");
    }

    if (appointment.status !== "SCHEDULED") {
      return {
        success: true,
        callStatus: "EXPIRED",
        applicationId: getVonageApplicationId(),
        videoSessionId: appointment.videoSessionId || null,
        token: null,
        message: "This appointment is not currently scheduled",
      };
    }

    let videoSessionId = appointment.videoSessionId;

    if (!videoSessionId) {
      videoSessionId = await createVideoSession();

      await db.appointment.update({
        where: {
          id: appointment.id,
        },
        data: {
          videoSessionId,
        },
      });
    }

    const now = new Date();
    const { appointmentEndTime, joinWindowStart, joinWindowEnd } =
      getCallWindow(appointment);

    if (now < joinWindowStart) {
      return {
        success: true,
        callStatus: "PENDING",
        applicationId: getVonageApplicationId(),
        videoSessionId,
        token: null,
        joinWindowStart: joinWindowStart.toISOString(),
        joinWindowEnd: joinWindowEnd.toISOString(),
        message: `This call will go live ${CALL_JOIN_WINDOW_MINUTES} minutes before the scheduled time`,
      };
    }

    if (now > joinWindowEnd) {
      return {
        success: true,
        callStatus: "EXPIRED",
        applicationId: getVonageApplicationId(),
        videoSessionId,
        token: null,
        joinWindowStart: joinWindowStart.toISOString(),
        joinWindowEnd: joinWindowEnd.toISOString(),
        message: "This video call session has expired",
      };
    }

    const expirationTime =
      Math.floor(appointmentEndTime.getTime() / 1000) +
      CALL_TOKEN_GRACE_MINUTES * 60;

    const connectionData = buildVonageConnectionData(user);

    const vonage = getVonageClient();
    const token = vonage.video.generateClientToken(videoSessionId, {
      role: "publisher",
      expireTime: expirationTime,
      data: connectionData,
    });

    return {
      success: true,
      callStatus: "LIVE",
      applicationId: getVonageApplicationId(),
      videoSessionId,
      token,
      joinWindowStart: joinWindowStart.toISOString(),
      joinWindowEnd: joinWindowEnd.toISOString(),
    };
  } catch (error) {
    console.error("Failed to prepare video call session:", error);
    return { success: false, error: error.message };
  }
}
