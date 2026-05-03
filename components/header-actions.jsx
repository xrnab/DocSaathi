"use client";

import React from "react";
import { Button } from "./ui/button";
import {
  Calendar,
  CreditCard,
  ShieldCheck,
  Stethoscope,
  User,
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

export function HeaderActions({ dbUser }) {
  const { user: clerkUser, isLoaded } = useUser();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  // Use DB user if available, otherwise fall back to Clerk user data
  // This helps bridge the gap immediately after sign-in
  const role = dbUser?.role || "UNASSIGNED";
  const isProfileComplete = dbUser?.isProfileComplete;
  const credits = dbUser?.credits;

  if (!mounted || !isLoaded) {
    return <div className="h-9 w-20 bg-muted animate-pulse rounded-full" />;
  }

  return (
    <>
      <SignedIn>
        {/* Admin/Owner Links */}
        {(role === "ADMIN" || role === "OWNER") && (
          <Link href="/admin">
            <Button
              variant="outline"
              className="hidden md:inline-flex items-center gap-2 border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-900/20"
            >
              <ShieldCheck className="h-4 w-4 text-sky-500" />
              Admin Dashboard
            </Button>
            <Button variant="ghost" className="md:hidden w-10 h-10 p-0 text-sky-500">
              <ShieldCheck className="h-4 w-4" />
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
            <Button variant="ghost" asChild className="md:hidden w-10 h-10 p-0">
              <Link href="/doctor">
                <Stethoscope className="h-4 w-4" />
              </Link>
            </Button>
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
            <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
              <Calendar className="h-4 w-4" />
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
            <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
              <User className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </SignedIn>

      {(role !== "ADMIN" && role !== "OWNER") && (
        <Link href={!dbUser || role === "PATIENT" ? "/pricing" : "/doctor"}>
          <Badge
            variant="outline"
            className="h-9 bg-sky-100 dark:bg-sky-900/20 border-sky-300 dark:border-sky-700/30 px-3 py-1 flex items-center gap-2"
          >
            <CreditCard className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
            <span className="text-sky-600 dark:text-sky-400 font-medium">
              {dbUser && role !== "ADMIN" && role !== "OWNER" ? (
                <>
                  {credits}{" "}
                  <span className="hidden md:inline">
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
      </SignedIn>
    </>
  );
}
