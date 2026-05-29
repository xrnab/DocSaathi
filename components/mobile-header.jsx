import React, { Suspense } from "react";
import { Activity, Menu, Home, Stethoscope, BarChart3, CreditCard, ShieldCheck, Heart, MessageSquare, PhoneCall, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "./ui/sheet";
import { ModeToggle } from "./mode-toggle";
import GoogleTranslate from "./google-translate";
import { checkUser } from "@/lib/checkUser";
import { checkAndAllocateCredits } from "@/actions/credits";
import MobileUserSection from "./mobile-user-section";

/**
 * Mobile Hamburger Menu Component
 */
async function MobileMenu() {
  const user = await checkUser();
  const role = user?.role || "UNASSIGNED";

  if (user?.role === "PATIENT") {
    await checkAndAllocateCredits(user);
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted/50 rounded-full h-11 w-11 shrink-0">
          <Menu className="h-7 w-7" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] bg-black/95 backdrop-blur-2xl border-none text-white p-0 flex flex-col h-[100dvh]">
        <div className="p-6 flex flex-col gap-6 flex-1 overflow-y-auto scrollbar-hide">
          <SheetHeader className="text-left">
            <SheetTitle className="text-white flex items-center gap-2">
              <div className="bg-sky-500 p-1.5 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">DocSaathi</span>
            </SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col gap-1">
            <Link href="/" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-colors group">
              <Home className="h-5 w-5 text-sky-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm uppercase tracking-wider text-slate-200">Home</span>
            </Link>
            <Link href="/doctors" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-colors group">
              <Stethoscope className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm uppercase tracking-wider text-slate-200">Doctors</span>
            </Link>
            <Link href="/impact" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-colors group">
              <BarChart3 className="h-5 w-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm uppercase tracking-wider text-slate-200">Impact</span>
            </Link>
            <Link href="/pricing" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-colors group">
              <CreditCard className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm uppercase tracking-wider text-slate-200">Pricing</span>
            </Link>
            
            <div className="h-px bg-white/10 my-2" />

            {role === "ADMIN" && (
              <Link href="/admin" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-colors group">
                <ShieldCheck className="h-5 w-5 text-sky-400 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm uppercase tracking-wider text-slate-200">Admin</span>
              </Link>
            )}
            {role === "DOCTOR" && (
              <Link href="/doctor" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-colors group">
                <Stethoscope className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm uppercase tracking-wider text-slate-200">Doctor Hub</span>
              </Link>
            )}
            {role === "ASHA_WORKER" && (
              <Link href="/asha" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-colors group">
                <Heart className="h-5 w-5 text-rose-400 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm uppercase tracking-wider text-slate-200">ASHA Worker</span>
              </Link>
            )}
            
            <Link href="/sms-demo" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-colors group">
              <MessageSquare className="h-5 w-5 text-slate-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm uppercase tracking-wider text-slate-200">SMS Demo</span>
            </Link>

            <Link href="/demo" className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-colors group">
              <Sparkles className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm uppercase tracking-wider text-slate-200">Live Demo Portal</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Actions Stack (Fixed at bottom) */}
        <div className="mt-auto flex flex-col gap-4 p-6 bg-black/40 border-t border-white/5 pb-safe" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
           <Suspense fallback={<div className="h-32 w-full bg-white/5 animate-pulse rounded-2xl" />}>
             <MobileUserSection dbUser={user} />
           </Suspense>

           <Link href="/emergency" className="w-full">
             <Button variant="destructive" className="w-full justify-center gap-2.5 rounded-2xl h-12 bg-red-600 hover:bg-red-700 font-black shadow-lg shadow-red-500/25 text-xs">
               <PhoneCall className="h-4 w-4 animate-pulse" />
               <span className="uppercase tracking-widest">Emergency SOS</span>
             </Button>
           </Link>

           <div className="grid grid-cols-2 gap-3">
             <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Theme</span>
                <ModeToggle />
             </div>
             <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Language</span>
                <GoogleTranslate />
             </div>
           </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function MobileHeader() {
  return (
    <nav className="flex md:hidden w-full max-w-[calc(100vw-1rem)] min-h-[4.5rem] items-center justify-between bg-background/70 backdrop-blur-xl border border-border shadow-lg shadow-sky-500/5 rounded-[2.5rem] px-5 py-2">
      {/* Logo Left */}
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <div className="bg-gradient-to-br from-sky-400 to-blue-600 p-2.5 rounded-xl shadow-md">
          <Activity className="h-5.5 w-5.5 text-white" />
        </div>
        <span className="text-xl font-bold text-foreground tracking-tight">DocSaathi</span>
      </Link>

      {/* Hamburger Right */}
      <Suspense fallback={<div className="h-11 w-11 bg-muted animate-pulse rounded-full" />}>
        <MobileMenu />
      </Suspense>
    </nav>
  );
}
