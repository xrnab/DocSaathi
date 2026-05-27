import React from "react";
import { Button } from "./ui/button";
import { Activity, PhoneCall } from "lucide-react";
import Link from "next/link";
import { checkUser } from "@/lib/checkUser";
import { checkAndAllocateCredits } from "@/actions/credits";
import { ModeToggle } from "./mode-toggle";
import GoogleTranslate from "./google-translate";
import { HeaderActions } from "./header-actions";

export default async function Header() {
  const user = await checkUser();
  if (user?.role === "PATIENT") {
    await checkAndAllocateCredits(user);
  }

  return (
    <header className="absolute top-4 sm:top-6 left-0 right-0 z-50 px-2 sm:px-4 flex justify-center pointer-events-none">
      <nav className="w-[94%] sm:w-full max-w-5xl min-h-[3rem] sm:min-h-[3.25rem] flex items-center justify-between bg-slate-950/40 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20 rounded-full px-3 sm:px-5 py-1.5 gap-2 pointer-events-auto">
        <Link href="/" className="flex flex-col gap-0 cursor-pointer shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="bg-gradient-to-br from-sky-400 to-blue-600 p-1 rounded-lg shadow-lg shadow-sky-500/20">
              <Activity className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="text-base sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500 tracking-tight">
              Doc<span className="text-white">Saathi</span>
            </span>
          </div>
          <span className="text-[6px] sm:text-[8px] font-bold text-slate-300 tracking-wider pl-1 uppercase leading-none truncate max-w-[100px] sm:max-w-none hidden xs:block">
            Nabha's Health Companion
          </span>
        </Link>

        {/* Unified Actions - Responsive */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          {/* Circular SOS Button */}
          <Button asChild variant="destructive" size="icon" className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-full w-8 h-8 sm:w-9 sm:h-9 shadow-lg shadow-red-500/20 shrink-0 notranslate">
            <a href="tel:108">
              <PhoneCall className="h-4 w-4 sm:h-5 sm:w-5" />
            </a>
          </Button>

          <HeaderActions dbUser={user} />

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <GoogleTranslate />
            <ModeToggle />
          </div>
        </div>
      </nav>
    </header>
  );
}
