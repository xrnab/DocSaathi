import React, { Suspense } from "react";
import { Button } from "./ui/button";
import { Activity, PhoneCall } from "lucide-react";
import Link from "next/link";
import { checkUser } from "@/lib/checkUser";
import { checkAndAllocateCredits } from "@/actions/credits";
import { ModeToggle } from "./mode-toggle";
import GoogleTranslate from "./google-translate";
import { HeaderActions } from "./header-actions";
import { BottomNav } from "./bottom-nav";

/**
 * Async component to handle user authentication and credit allocation
 * Isolated to prevent blocking the entire navigation shell
 */
async function UserAuthSection() {
  const user = await checkUser();
  
  if (user?.role === "PATIENT") {
    // This handles monthly credit allocation for subscribers
    await checkAndAllocateCredits(user);
  }

  return <HeaderActions dbUser={user} />;
}

/**
 * Async component for BottomNav to maintain user-role awareness
 */
async function BottomNavSection() {
  const user = await checkUser();
  return user?.role === "PATIENT" ? <BottomNav /> : null;
}

export default function Header() {
  return (
    <>
      <header className="absolute top-2 left-0 right-0 z-50 px-2 sm:px-4 flex justify-center transition-all duration-500 [.status-bar-active_&]:top-11 sm:[.status-bar-active_&]:top-12">
        <nav className="container max-w-7xl min-h-[3.25rem] sm:min-h-[3.5rem] flex items-center justify-between bg-background/70 backdrop-blur-xl border border-border shadow-lg shadow-sky-500/5 rounded-[2rem] px-3 sm:px-6 py-1 sm:py-1.5 gap-2 transition-all">
          
          {/* Logo - Static / Fast Load */}
          <Link href="/" className="flex flex-col gap-0.5 cursor-pointer shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="bg-gradient-to-br from-sky-400 to-blue-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-lg shadow-sky-500/20">
                <Activity className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="text-lg sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-700 dark:from-sky-400 dark:to-blue-500 tracking-tight overflow-hidden">
                <span className="hidden xs:inline">Doc</span><span className="text-foreground">Saathi</span>
              </span>
            </div>
            <span className="text-[7px] sm:text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-wider pl-1 uppercase leading-none truncate hidden xs:block">
              Serving Nabha & surrounding villages
            </span>
          </Link>

          {/* Action Buttons Flex - Swipe-scrollable on mobile, static on desktop */}
          <div className="flex items-center justify-end space-x-1.5 sm:space-x-2 overflow-x-auto no-scrollbar whitespace-nowrap flex-1 min-w-0 sm:flex-initial sm:max-w-none shrink-0 scroll-smooth pb-0.5">
            {/* SOS Emergency Button - Static / Instant */}
            <Button asChild variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-red-500/20 rounded-full px-3 h-9 shrink-0 notranslate">
              <a href="tel:108">
                <PhoneCall className="h-4 w-4" />
                <span className="hidden xl:inline">Emergency SOS</span>
                <span className="hidden sm:inline xl:hidden">SOS</span>
              </a>
            </Button>

            {/* Suspended User Logic - Prevents blocking the shell */}
            <Suspense fallback={<div className="h-8 w-8 sm:h-9 sm:w-20 bg-muted/50 animate-pulse rounded-full shrink-0" />}>
              <UserAuthSection />
            </Suspense>

            {/* Utilities - Static / Instant */}
            <div className="shrink-0 flex items-center">
              <GoogleTranslate />
            </div>
            
            <div className="hidden sm:inline-flex shrink-0">
              <ModeToggle />
            </div>
          </div>
        </nav>
      </header>

      {/* Conditional BottomNav - Suspended */}
      <Suspense fallback={null}>
        <BottomNavSection />
      </Suspense>
    </>
  );
}
