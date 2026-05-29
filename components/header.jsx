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
import HeaderScrollContainer from "./header-scroll-container";
import MobileHeader from "./mobile-header";

/**
 * Shared logic for user authentication
 */
async function UserAuthSection() {
  const user = await checkUser();
  if (user?.role === "PATIENT") {
    await checkAndAllocateCredits(user);
  }
  return <HeaderActions dbUser={user} />;
}

export default function Header() {
  return (
    <>
      <header className="absolute top-2 left-0 right-0 z-50 px-2 sm:px-4 flex justify-center transition-all duration-500 [.status-bar-active_&]:top-11 sm:[.status-bar-active_&]:top-12">
        
        {/* --- DESKTOP NAV (REVERTED TO ORIGINAL) --- */}
        <nav className="hidden md:flex container max-w-7xl min-h-[3.5rem] items-center justify-between bg-background/70 backdrop-blur-xl border border-border shadow-lg shadow-sky-500/5 rounded-[2rem] px-6 py-1.5 gap-2 transition-all">
          <Link href="/" className="flex flex-col gap-0.5 cursor-pointer shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-sky-400 to-blue-600 p-2 rounded-xl shadow-lg shadow-sky-500/20">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-700 dark:from-sky-400 dark:to-blue-500 tracking-tight">
                Doc<span className="text-foreground">Saathi</span>
              </span>
            </div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-wider pl-1 uppercase leading-none truncate">
              Serving Nabha & surrounding villages
            </span>
          </Link>

          <div className="flex items-center justify-end gap-3 flex-initial z-[60]">
            <Link href="/emergency" className="shrink-0">
              <Button variant="destructive" className="px-3 py-1.5 gap-1 bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/25 rounded-full font-black text-[10px]">
                <PhoneCall className="h-4 w-4 animate-pulse shrink-0" />
                <span className="hidden sm:inline tracking-wider uppercase leading-none">SOS</span>
              </Button>
            </Link>

            <HeaderScrollContainer>
              <Suspense fallback={<div className="h-9 w-20 bg-muted/50 animate-pulse rounded-full shrink-0" />}>
                <UserAuthSection />
              </Suspense>
              <div className="shrink-0 flex items-center">
                <GoogleTranslate />
              </div>
              <div className="shrink-0 gap-2 flex">
                <ModeToggle />
              </div>
            </HeaderScrollContainer>
          </div>
        </nav>

        {/* --- MOBILE NAV (LOGO LEFT, HAMBURGER RIGHT) --- */}
        <Suspense fallback={<div className="flex md:hidden w-full h-14 bg-background/70 backdrop-blur-xl rounded-[2rem] animate-pulse" />}>
          <MobileHeader />
        </Suspense>
      </header>

      {/* Conditional BottomNav logic remains for Patients */}
      <Suspense fallback={null}>
        <AsyncBottomNav />
      </Suspense>
    </>
  );
}

/**
 * Separate component to keep Header clean
 */
async function AsyncBottomNav() {
  const user = await checkUser();
  return user?.role === "PATIENT" ? <BottomNav /> : null;
}
