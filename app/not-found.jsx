import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="space-y-8 max-w-md w-full">
        {/* DocSaathi Branded Header */}
        <div className="flex items-center justify-center gap-2 select-none">
          <span className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
            Doc<span className="text-sky-500">Saathi</span>
          </span>
        </div>

        {/* SVG Illustration */}
        <div className="flex justify-center">
          <div className="p-5 bg-emerald-50 dark:bg-emerald-950/20 rounded-full border border-emerald-100 dark:border-emerald-900/30 text-emerald-500 animate-pulse">
            <svg
              className="w-20 h-20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.871 4A17.926 17.926 0 003 12c0 2.21 1.21 4.14 3.018 5.187M3 12h5m-5 0h5m0 0l3 9m-3-9l3-9m9 2.187A17.926 17.926 0 0019.129 4M21 12h-5m5 0h-5m0 0l-3 9m3-9l-3-9m-9 6h12m-6 3H7.5m6.5 0h2.5"
              />
            </svg>
          </div>
        </div>

        {/* Not Found Content */}
        <div className="space-y-3">
          <h1 className="text-7xl font-black text-slate-400 dark:text-slate-600 font-mono tracking-widest">
            404
          </h1>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
            Page not found
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The page you're looking for doesn't exist or has moved. Let's get you back on track!
          </p>
        </div>

        {/* Two Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            asChild
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl py-6 px-6 shadow-lg shadow-emerald-500/10 gap-2 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <Link href="/">Go Home</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-sky-200 dark:border-sky-850 hover:bg-sky-50 dark:hover:bg-sky-950/20 text-sky-600 dark:text-sky-400 font-extrabold rounded-xl py-6 px-6 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <Link href="/appointments">Check Appointments</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
