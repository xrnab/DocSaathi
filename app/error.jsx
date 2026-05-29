"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-background select-none animate-in fade-in duration-300">
      <div className="flex flex-col items-center max-w-md w-full">
        {/* AlertTriangle icon */}
        <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-4 animate-bounce" />

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Something went wrong
        </h2>

        {/* Description */}
        <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
          An unexpected error occurred. Our team has been notified.
        </p>

        {/* Diagnostic fallback block in development */}
        {isDev && error?.message && (
          <pre className="mt-4 text-left text-xs bg-muted dark:bg-slate-900 p-3 rounded-xl max-w-lg overflow-auto text-rose-600 dark:text-rose-400 font-mono w-full max-h-40 border border-border">
            {error.message}
          </pre>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <Button 
            onClick={reset}
            className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-xl px-5 py-5 cursor-pointer shadow-md shadow-sky-500/10"
          >
            Try Again
          </Button>
          <Button 
            variant="outline" 
            asChild
            className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/20 text-slate-700 dark:text-slate-350 font-extrabold rounded-xl px-5 py-5 cursor-pointer"
          >
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
