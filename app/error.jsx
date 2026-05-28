"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, Home, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    // Log the error to console
    console.error("ErrorBoundary caught an unhandled runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 py-16 relative overflow-hidden">
      {/* Subtle red/orange background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/5 dark:bg-red-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      <Card className="max-w-md w-full bg-card/60 backdrop-blur-xl border border-red-500/10 shadow-2xl relative z-10 p-4 sm:p-6 text-center animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="flex flex-col items-center pb-2">
          {/* Logo Section */}
          <div className="flex flex-col gap-0.5 items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-sky-400 to-blue-600 p-2 rounded-xl shadow-lg shadow-sky-500/20">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-700 dark:from-sky-400 dark:to-blue-500 tracking-tight">
                Doc<span className="text-foreground">Saathi</span>
              </span>
            </div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase leading-none mt-1">
              Serving Nabha & surrounding villages
            </span>
          </div>

          <div className="w-16 h-16 rounded-full bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center text-red-500 mb-4">
            <AlertTriangle className="h-8 w-8 animate-bounce text-red-500" />
          </div>
          
          <CardTitle className="text-2xl font-extrabold tracking-tight text-foreground">
            Something went wrong
          </CardTitle>
          <CardDescription className="mt-2 text-sm sm:text-base text-muted-foreground">
            An unexpected error occurred while loading this page. Our systems have logged this issue.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-2">
          {/* Error Message Code Block */}
          {error && (
            <div className="bg-slate-100 dark:bg-slate-900/60 border border-border/60 rounded-xl p-3 sm:p-4 text-left max-h-36 overflow-auto">
              <code className="text-xs font-mono text-red-600 dark:text-red-400 break-all leading-normal whitespace-pre-wrap">
                {error.message || error.toString() || "Unknown error occurred"}
              </code>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
            <Button
              asChild
              variant="outline"
              className="border-sky-500/20 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-300 rounded-full font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98] h-11"
            >
              <Link href="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" /> Go to Home
              </Link>
            </Button>
            <Button
              onClick={() => reset()}
              className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 rounded-full font-bold transition-transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 h-11"
            >
              <RefreshCw className="h-4 w-4 animate-spin-slow" /> Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
