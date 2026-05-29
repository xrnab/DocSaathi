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
  Sparkles,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { SignInButton, useUser } from "@clerk/nextjs";
import { ThemeAwareUserButton, Show } from "./clerk-elements";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationBell from "./notification-bell";
import OfflineFirstBadge from "./offline-first-badge";

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
      <OfflineFirstBadge />

      {/* Consolidated Control Panel / Demo Hub Dropdowns */}
      {(role === "ADMIN" || role === "OWNER") ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-1.5 rounded-full h-8 px-2.5 text-xs sm:h-9 sm:px-4 sm:text-sm border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 font-bold hover:scale-102 active:scale-98 transition-all shadow-md shadow-sky-500/5 cursor-pointer shrink-0"
            >
              <ShieldCheck className="h-4 w-4 text-sky-500 animate-pulse shrink-0" />
              <span>Control Panel</span>
              <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl border-slate-200 dark:border-slate-800 p-1.5 shadow-xl bg-card/95 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 z-[60]">
            <DropdownMenuItem asChild className="rounded-xl cursor-pointer hover:bg-sky-500/10 focus:bg-sky-500/10 transition-colors">
              <Link href="/admin" className="flex items-center gap-2.5 px-2.5 py-2 text-xs sm:text-sm font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-sky-500" />
                Admin Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl cursor-pointer hover:bg-rose-500/10 focus:bg-rose-500/10 transition-colors">
              <Link href="/admin/outbreak" className="flex items-center gap-2.5 px-2.5 py-2 text-xs sm:text-sm font-semibold text-foreground">
                <Activity className="h-4 w-4 text-rose-500" />
                Outbreak Alert Map
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl cursor-pointer hover:bg-emerald-500/10 focus:bg-emerald-500/10 transition-colors">
              <Link href="/demo" className="flex items-center gap-2.5 px-2.5 py-2 text-xs sm:text-sm font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" />
                Live Judging Demo
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl cursor-pointer hover:bg-indigo-500/10 focus:bg-indigo-500/10 transition-colors">
              <Link href="/sms-demo" className="flex items-center gap-2.5 px-2.5 py-2 text-xs sm:text-sm font-semibold text-foreground">
                <MessageSquare className="h-4 w-4 text-indigo-500" />
                SMS Keypad Demo
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-1 border-none bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold hover:scale-102 active:scale-98 transition-all rounded-full h-8 px-2 text-xs sm:h-9 sm:px-3.5 sm:text-sm cursor-pointer relative shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 animate-pulse shrink-0" />
              <span>Demo Hub</span>
              <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
              <span className="absolute top-0.5 right-0.5 flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-2xl border-slate-200 dark:border-slate-800 p-1.5 shadow-xl bg-card/95 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 z-[60]">
            <DropdownMenuItem asChild className="rounded-xl cursor-pointer hover:bg-emerald-500/10 focus:bg-emerald-500/10 transition-colors">
              <Link href="/demo" className="flex items-center gap-2 px-2.5 py-2 text-xs sm:text-sm font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                Live Demo Portal
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl cursor-pointer hover:bg-indigo-500/10 focus:bg-indigo-500/10 transition-colors">
              <Link href="/sms-demo" className="flex items-center gap-2 px-2.5 py-2 text-xs sm:text-sm font-semibold text-foreground">
                <MessageSquare className="h-4 w-4 text-indigo-500" />
                SMS Triage Demo
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Show when="signed-in">
        {/* ASHA Worker Dashboard Link */}
        {role === "ASHA_WORKER" && (
          <Link href="/asha">
            <Button
              variant="outline"
              size="icon"
              className="md:w-auto md:px-4 items-center gap-2 rounded-full h-8 w-8 sm:h-9 sm:w-9 border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-900/20 font-bold text-sky-600 dark:text-sky-400 shrink-0"
            >
              <Heart className="h-4 w-4 text-sky-500 fill-sky-500/20 animate-pulse shrink-0" />
              <span className="hidden md:inline">ASHA Dashboard</span>
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
                className="md:w-auto md:px-4 items-center gap-2 rounded-full h-8 w-8 sm:h-9 sm:w-9 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20 font-bold text-indigo-600 dark:text-indigo-400 hover:scale-102 active:scale-98 transition-all shadow-md shadow-indigo-500/5 cursor-pointer shrink-0"
              >
                <Stethoscope className="h-4 w-4 text-indigo-500 animate-pulse shrink-0" />
                <span className="hidden md:inline">Doctor Dashboard</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl border-slate-200 dark:border-slate-800 p-1.5 shadow-xl bg-card/95 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 z-[60]">
              <DropdownMenuItem asChild className="rounded-xl cursor-pointer hover:bg-indigo-500/10 focus:bg-indigo-500/10 transition-colors">
                <Link href="/doctor" className="flex items-center gap-2.5 px-2.5 py-2 text-xs sm:text-sm font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-indigo-500" />
                  Main Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-xl cursor-pointer hover:bg-sky-500/10 focus:bg-sky-500/10 transition-colors">
                <Link href="/doctor/profile" className="flex items-center gap-2.5 px-2.5 py-2 text-xs sm:text-sm font-semibold text-foreground">
                  <User className="h-4 w-4 text-sky-500" />
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
              className={`md:w-auto md:px-4 items-center gap-2 rounded-full h-8 w-8 sm:h-9 sm:w-9 shrink-0 transition-all shadow-md hover:scale-102 active:scale-98 cursor-pointer ${
                isProfileComplete
                  ? "border-emerald-250 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 font-bold text-emerald-600 dark:text-emerald-400 shadow-emerald-500/5"
                  : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 shadow-amber-500/5 animate-pulse"
              }`}
            >
              <Calendar className={`h-4 w-4 shrink-0 ${isProfileComplete ? "text-emerald-500" : "text-amber-500 animate-bounce"}`} />
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
              className="md:w-auto md:px-4 items-center gap-2 rounded-full h-8 w-8 sm:h-9 sm:w-9 border-amber-250 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-900/20 font-bold text-amber-600 dark:text-amber-400 animate-pulse hover:scale-102 active:scale-98 transition-all shadow-md shadow-amber-500/5 cursor-pointer shrink-0"
            >
              <User className="h-4 w-4 text-amber-500 shrink-0" />
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
            className="md:w-auto md:px-3 bg-sky-500 hover:bg-sky-600 border-none text-white rounded-full h-8 w-8 sm:h-9 sm:w-auto gap-2 shadow-lg shadow-sky-500/20 shrink-0"
          >
            <CreditCard className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            {dbUser && role !== "ADMIN" && role !== "OWNER" ? (
              <span className="hidden md:inline text-xs font-bold">
                {credits} {role === "PATIENT" ? "Credits" : "Earned Credits"}
              </span>
            ) : (
              <span className="hidden md:inline text-xs font-bold">Pricing</span>
            )}
          </Button>
        </Link>
      )}

      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button variant="secondary" size="sm" className="font-semibold px-2 sm:px-4 shadow-sm h-8 sm:h-9 text-xs rounded-full shrink-0">
            <User className="h-4 w-4 md:hidden shrink-0" />
            <span className="hidden md:inline">Sign In</span>
          </Button>
        </SignInButton>
      </Show>

      <Show when="signed-in">
        <div className="flex items-center gap-2.5 shrink-0">
          <NotificationBell userId={dbUser?.id} />
          <ThemeAwareUserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8 sm:w-10 sm:h-10",
                userButtonPopoverCard: "shadow-xl",
                userPreviewMainIdentifier: "font-semibold",
              },
            }}
            afterSignOutUrl="/"
          />
        </div>
      </Show>
    </>
  );
}
