"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    console.error("DocSaathi Application Error:", error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="space-y-6 max-w-md w-full">
        {/* Branded Header */}
        <div className="flex items-center justify-center gap-2 select-none">
          <span className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
            Doc<span className="text-sky-500">Saathi</span>
          </span>
        </div>

        {/* Error icon/illustration */}
        <div className="flex justify-center">
          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-full border border-red-100 dark:border-red-900/30 text-red-500 animate-bounce">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
            Something went wrong
          </h2>
          <p className="text-sm text-muted-foreground">
            We encountered an unexpected error while processing this screen.
          </p>
        </div>

        {/* Conditionally show error message in dev mode */}
        {isDev && error?.message && (
          <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl border border-border text-left overflow-x-auto text-xs font-mono text-slate-800 dark:text-slate-300 max-h-40">
            <strong>Error details:</strong>
            <pre className="mt-1 whitespace-pre-wrap">{error.message}</pre>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            onClick={() => reset()}
            className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-xl py-6 px-6 shadow-lg shadow-sky-500/10 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Try again
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/20 text-slate-700 dark:text-slate-350 font-extrabold rounded-xl py-6 px-6 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
