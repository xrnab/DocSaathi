"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Stethoscope, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const NAV_ITEMS = [
    { label: "Home", href: "/", icon: Home },
    { label: "Doctors", href: "/doctors", icon: Stethoscope },
    { label: "Dashboard", href: "/patients", icon: Calendar },
    { label: "Profile", href: "/patients/onboarding", icon: User },
  ];

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-background/95 backdrop-blur-xl border-t border-border flex items-center justify-around px-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center justify-center h-full w-16 transition-all duration-300"
          >
            <div className={cn(
              "flex flex-col items-center justify-center gap-1",
              isActive ? "text-sky-600 dark:text-sky-500 font-bold" : "text-slate-400"
            )}>
              <Icon className="h-5 w-5 transition-transform active:scale-95" />
              {isActive && (
                <span className="text-[10px] font-black uppercase tracking-wider animate-in fade-in zoom-in duration-200">
                  {item.label}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
