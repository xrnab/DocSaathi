"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { pusherServer } from "@/lib/pusher";
import { revalidatePath } from "next/cache";

/**
 * Create a new notification and trigger a Pusher real-time event
 */
export async function createNotification(userId, message, type) {
  try {
    const notification = await db.notification.create({
      data: {
        userId,
        message,
        type,
        read: false,
      },
    });

    // Trigger Pusher event in real-time
    try {
      await pusherServer.trigger(`user-${userId}`, "new-notification", {
        id: notification.id,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        createdAt: notification.createdAt.toISOString(),
      });
    } catch (pushError) {
      // Pusher fails gracefully if keys are empty/unset during initial load
      console.warn("Pusher trigger failed (credentials might be unset):", pushError.message);
    }

    return { success: true, notification };
  } catch (error) {
    console.error("Failed to create notification:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(notificationId) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const notification = await db.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== user.id) {
      throw new Error("Notification not found or unauthorized");
    }

    const updated = await db.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    revalidatePath("/doctor");
    revalidatePath("/patients");
    revalidatePath("/admin");
    return { success: true, notification: updated };
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    throw new Error(error.message);
  }
}

/**
 * Get all unread notifications for a user
 */
export async function getUnreadNotifications(userId) {
  try {
    const notifications = await db.notification.findMany({
      where: {
        userId,
        read: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, notifications };
  } catch (error) {
    console.error("Failed to get unread notifications:", error);
    return { success: false, error: error.message, notifications: [] };
  }
}
