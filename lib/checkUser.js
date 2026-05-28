import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";
import { cache } from "react";

export const checkUser = cache(async () => {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  try {
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
      include: {
        transactions: {
          where: {
            type: "CREDIT_PURCHASE",
            // Only get transactions from current month
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (loggedInUser) {
      // Auto-upgrade Arnab to OWNER if not already
      if (
        (user.firstName === "Arnab" && user.lastName === "Chowdhury") ||
        user.emailAddresses[0].emailAddress === "arnabchowdhury.off@gmail.com"
      ) {
        if (loggedInUser.role !== "OWNER") {
          return await db.user.update({
            where: { id: loggedInUser.id },
            data: { role: "OWNER" },
          });
        }
      }
      return loggedInUser;
    }

    const name = [user.firstName, user.lastName]
      .filter(val => val && val !== "null" && val !== "undefined")
      .join(" ");

    const hasEmail = user.emailAddresses && user.emailAddresses.length > 0;
    const email = hasEmail 
      ? user.emailAddresses[0].emailAddress 
      : `${user.id}@phone.docsaathi.local`; // Fallback for phone-only registrations

    const isArnab = 
      (user.firstName === "Arnab" && user.lastName === "Chowdhury") ||
      (hasEmail && user.emailAddresses[0].emailAddress === "arnabchowdhury.off@gmail.com");

    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email,
        role: isArnab ? "OWNER" : "UNASSIGNED",
        transactions: {
          create: {
            type: "CREDIT_PURCHASE",
            packageId: "free_user",
            amount: 0,
          },
        },
      },
    });

    return newUser;
  } catch (error) {
    console.log(error.message);
  }
});
