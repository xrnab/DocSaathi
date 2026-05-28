import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 py-16 relative overflow-hidden">
      {/* Subtle background gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/5 dark:bg-sky-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      <Card className="max-w-md w-full bg-card/60 backdrop-blur-xl border border-sky-500/10 shadow-2xl relative z-10 p-4 sm:p-6 text-center animate-in fade-in zoom-in-95 duration-500">
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

          <div className="w-16 h-16 rounded-full bg-sky-500/10 dark:bg-sky-500/20 flex items-center justify-center text-sky-500 mb-4">
            <Activity className="h-8 w-8 animate-pulse" />
          </div>
          
          <CardTitle className="text-4xl font-extrabold tracking-tight text-foreground">
            404
          </CardTitle>
          <CardTitle className="text-xl font-bold text-foreground/90 mt-1">
            Page Not Found
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <CardDescription className="text-sm sm:text-base text-muted-foreground">
            We couldn't find the page you are looking for. It might have been moved, deleted, or the URL might be incorrect.
          </CardDescription>
          
          <div className="flex justify-center pt-2">
            <Button
              asChild
              className="bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-500/20 rounded-full px-8 font-bold transition-transform hover:scale-[1.02] active:scale-[0.98] h-11"
            >
              <Link href="/" className="flex items-center gap-2">
                <Home className="h-4 w-4" /> Go to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
