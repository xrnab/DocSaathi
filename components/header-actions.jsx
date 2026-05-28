"use client";

import React from "react";
import { Button } from "./ui/button";
import {
  Calendar,
  CreditCard,
  ShieldCheck,
  Stethoscope,
  User,
  Heart,
  MessageSquare,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { ThemeAwareUserButton } from "./clerk-elements";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationBell from "./notification-bell";

export function HeaderActions({ dbUser }) {
  const { user: clerkUser, isLoaded } = useUser();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  // Use DB user if available, otherwise fall back to Clerk user data
  const role = dbUser?.role || "UNASSIGNED";
  const isProfileComplete = dbUser?.isProfileComplete;
  const credits = dbUser?.credits;

  if (!mounted || !isLoaded) {
    return <div className="h-9 w-20 bg-muted animate-pulse rounded-full" />;
  }

  return (
    <>
      {/* SMS Simulator Demo - always accessible as a feature showcase */}
      <Link href="/sms-demo">
        <Button
          variant="outline"
          className="hidden lg:inline-flex items-center gap-2 border-indigo-200 dark:border-indigo-850 bg-indigo-50/30 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold"
        >
          <MessageSquare className="h-4 w-4" />
          SMS Demo
        </Button>
      </Link>

      <SignedIn>
        {/* Admin/Owner Links */}
        {(role === "ADMIN" || role === "OWNER") && (
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button
                variant="outline"
                className="hidden md:inline-flex items-center gap-2 border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-900/20 font-bold"
              >
                <ShieldCheck className="h-4 w-4 text-sky-500" />
                Admin Dashboard
              </Button>
            </Link>
            <Link href="/admin/outbreak">
              <Button
                variant="outline"
                className="hidden md:inline-flex items-center gap-2 border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-900/20 font-bold"
              >
                <Activity className="h-4 w-4 text-rose-500" />
                Outbreak Alert
              </Button>
            </Link>
          </div>
        )}

        {/* ASHA Worker Dashboard Link */}
        {role === "ASHA_WORKER" && (
          <Link href="/asha">
            <Button
              variant="outline"
              className="hidden md:inline-flex items-center gap-2 border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-900/20 font-bold text-sky-600 dark:text-sky-400"
            >
              <Heart className="h-4 w-4 text-sky-500 fill-sky-500/20 animate-pulse" />
              ASHA Dashboard
            </Button>
          </Link>
        )}

        {/* Doctor Links */}
        {role === "DOCTOR" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="hidden md:inline-flex items-center gap-2"
              >
                <Stethoscope className="h-4 w-4" />
                Doctor Dashboard
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/doctor" className="cursor-pointer">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Main Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/doctor/profile" className="cursor-pointer">
                  <User className="h-4 w-4 mr-2" />
                  Manage Profile
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Patient Links */}
        {role === "PATIENT" && (
          <Link href={isProfileComplete ? "/patients" : "/patients/onboarding"}>
            <Button
              variant="outline"
              className={`hidden md:inline-flex items-center gap-2 ${!isProfileComplete ? "border-amber-200 bg-amber-50 dark:bg-amber-900/10 text-amber-600 animate-pulse" : ""}`}
            >
              <Calendar className="h-4 w-4" />
              {isProfileComplete ? "Patient Dashboard" : "Complete Profile"}
            </Button>
          </Link>
        )}

        {/* Unassigned Role */}
        {role === "UNASSIGNED" && (
          <Link href="/onboarding">
            <Button
              variant="outline"
              className="hidden md:inline-flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Complete Profile
            </Button>
          </Link>
        )}
      </SignedIn>

      {(role !== "ADMIN" && role !== "OWNER") && (
        <Link href={!dbUser || role === "PATIENT" ? "/pricing" : "/doctor"}>
          <Badge
            variant="outline"
            className="hidden sm:flex h-9 bg-sky-100 dark:bg-sky-900/20 border-sky-300 dark:border-sky-700/30 px-3 py-1 items-center gap-2"
          >
            <CreditCard className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
            <span className="text-sky-600 dark:text-sky-400 font-medium">
              {dbUser && role !== "ADMIN" && role !== "OWNER" ? (
                <>
                  {credits}{" "}
                  <span className="hidden xs:inline">
                    {role === "PATIENT" ? "Credits" : "Earned Credits"}
                  </span>
                </>
              ) : (
                <>Pricing</>
              )}
            </span>
          </Badge>
        </Link>
      )}

      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="secondary" className="font-semibold px-6 shadow-sm">Sign In</Button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        <div className="flex items-center gap-2.5">
          <NotificationBell userId={dbUser?.id} />
          <ThemeAwareUserButton
            appearance={{
              elements: {
                avatarBox: "w-10 h-10",
                userButtonPopoverCard: "shadow-xl",
                userPreviewMainIdentifier: "font-semibold",
              },
            }}
            afterSignOutUrl="/"
          />
        </div>
      </SignedIn>
    </>
  );
}
