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
import { Show, SignInButton, useUser } from "@clerk/nextjs";
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
  const role = dbUser?.role || "UNASSIGNED";
  const isProfileComplete = dbUser?.isProfileComplete;
  const credits = dbUser?.credits;

  if (!mounted || !isLoaded) {
    return <div className="h-8 w-8 sm:h-9 sm:w-20 bg-muted animate-pulse rounded-full" />;
  }

  return (
    <>
      <Show when="signed-in">
        {/* Admin/Owner Links */}
        {(role === "ADMIN" || role === "OWNER") && (
          <Link href="/admin">
            <Button
              variant="outline"
              size="icon"
              className="md:w-auto md:px-4 items-center gap-2 border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-900/20 rounded-full h-8 w-8 sm:h-9 sm:w-9"
            >
              <ShieldCheck className="h-4 w-4 text-sky-500" />
              <span className="hidden md:inline">Admin Dashboard</span>
            </Button>
          </Link>
        )}

        {/* Doctor Links */}
        {role === "DOCTOR" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="md:w-auto md:px-4 items-center gap-2 rounded-full h-8 w-8 sm:h-9 sm:w-9"
              >
                <Stethoscope className="h-4 w-4" />
                <span className="hidden md:inline">Doctor Dashboard</span>
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
              size="icon"
              className={`md:w-auto md:px-4 items-center gap-2 rounded-full h-8 w-8 sm:h-9 sm:w-9 ${!isProfileComplete ? "border-amber-200 bg-amber-50 dark:bg-amber-900/10 text-amber-600 animate-pulse" : ""}`}
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden md:inline">{isProfileComplete ? "Patient Dashboard" : "Complete Profile"}</span>
            </Button>
          </Link>
        )}

        {/* Unassigned Role */}
        {role === "UNASSIGNED" && (
          <Link href="/onboarding">
            <Button
              variant="outline"
              size="icon"
              className="md:w-auto md:px-4 items-center gap-2 rounded-full h-8 w-8 sm:h-9 sm:w-9"
            >
              <User className="h-4 w-4" />
              <span className="hidden md:inline">Complete Profile</span>
            </Button>
          </Link>
        )}
      </Show>

      {/* Credits/Pricing - Circular Blue Button */}
      {(role !== "ADMIN" && role !== "OWNER") && (
        <Link href={!dbUser || role === "PATIENT" ? "/pricing" : "/doctor"}>
          <Button
            variant="outline"
            size="icon"
            className="md:w-auto md:px-3 bg-sky-500 hover:bg-sky-600 border-none text-white rounded-full h-8 w-8 sm:h-9 sm:w-auto gap-2 shadow-lg shadow-sky-500/20"
          >
            <CreditCard className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            {dbUser && role !== "ADMIN" && role !== "OWNER" ? (
              <span className="hidden md:inline text-xs font-bold">
                {credits} Credits
              </span>
            ) : (
              <span className="hidden md:inline text-xs font-bold">Pricing</span>
            )}
          </Button>
        </Link>
      )}

      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button variant="secondary" size="sm" className="font-semibold px-2 sm:px-4 shadow-sm h-8 sm:h-9 text-xs rounded-full">
            <User className="h-4 w-4 md:hidden" />
            <span className="hidden md:inline">Sign In</span>
          </Button>
        </SignInButton>
      </Show>

      <Show when="signed-in">
        <ThemeAwareUserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8 sm:w-9 sm:h-9",
              userButtonPopoverCard: "shadow-xl",
              userPreviewMainIdentifier: "font-semibold",
            },
          }}
          afterSignOutUrl="/"
        />
      </Show>
    </>
  );
}
