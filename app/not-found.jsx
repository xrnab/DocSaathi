import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-background select-none animate-in fade-in duration-300">
      <div className="flex flex-col items-center max-w-md w-full">
        {/* SVG medical cross */}
        <svg width="48" height="48" viewBox="0 0 48 48" className="mb-4">
          <rect x="18" y="4" width="12" height="40" rx="4" fill="#16a34a" opacity="0.8" />
          <rect x="4" y="18" width="40" height="12" rx="4" fill="#16a34a" opacity="0.8" />
        </svg>

        {/* Brand Name */}
        <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-8 tracking-tight">
          Doc<span className="text-sky-500">Saathi</span>
        </h2>

        {/* 404 Text */}
        <h1 className="text-8xl font-black text-muted-foreground/20 leading-none font-mono">
          404
        </h1>

        {/* Title */}
        <h3 className="text-2xl font-bold text-foreground mt-2 tracking-tight">
          Page not found
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
          The page you're looking for doesn't exist or may have moved.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-3">
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl px-5 py-5 cursor-pointer shadow-md shadow-emerald-500/10">
            <Link href="/">Go Home</Link>
          </Button>
          <Button variant="outline" asChild className="border-sky-200 dark:border-sky-850 hover:bg-sky-50 dark:hover:bg-sky-950/30 text-sky-600 dark:text-sky-400 font-extrabold rounded-xl px-5 py-5 cursor-pointer">
            <Link href="/appointments">My Appointments</Link>
          </Button>
        </div>

        {/* Bottom Text */}
        <p className="text-xs text-muted-foreground mt-12 font-medium">
          DocSaathi — Connecting Villages, Connecting Care
        </p>
      </div>
    </div>
  );
}
