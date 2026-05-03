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
    <header className="fixed top-4 left-0 right-0 z-50 px-2 sm:px-4 flex justify-center">
      <nav className="container max-w-7xl min-h-[4rem] flex flex-wrap items-center justify-between bg-background/70 backdrop-blur-xl border border-border shadow-lg shadow-sky-500/5 rounded-[2rem] px-4 sm:px-6 py-2 gap-2">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-sky-400 to-blue-600 p-2 rounded-xl shadow-lg shadow-sky-500/20">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-700 dark:from-sky-400 dark:to-blue-500 tracking-tight">
              Doc<span className="text-foreground">Saathi</span>
            </span>
          </div>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* SOS Emergency Button */}
          <Button asChild variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-red-500/20 rounded-full px-3 h-9 shrink-0 notranslate">
            <a href="tel:112">
              <PhoneCall className="h-4 w-4" />
              <span className="hidden xl:inline">Emergency SOS</span>
              <span className="hidden sm:inline xl:hidden">SOS</span>
            </a>
          </Button>

          <HeaderActions dbUser={user} />

          {/* Language Selector */}
          <GoogleTranslate />
          
          <ModeToggle />
        </div>
      </nav>
    </header>
  );
}


