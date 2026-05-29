"use client";

import { useState, useEffect } from "react";
import { 
  User, Stethoscope, Heart, Activity, MessageSquare, Pill, RefreshCw, AlertTriangle, CheckCircle, Sparkles, ArrowRight, Wifi
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { getUserRole } from "@/actions/records";
import { resetDemoSurveillanceData } from "@/actions/admin";

export default function DemoScenarioPortal() {
  const [userRole, setUserRole] = useState("UNASSIGNED");
  const [isResetting, setIsResetting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function fetchRole() {
      try {
        const role = await getUserRole();
        if (role) setUserRole(role);
      } catch (error) {
        console.error("Error retrieving user role:", error);
      }
    }
    fetchRole();
  }, []);

  const handleResetData = async () => {
    setIsResetting(true);
    toast.loading("Resetting epidemiological outbreak database and seeding baseline logs...");
    try {
      const res = await resetDemoSurveillanceData();
      if (res?.success) {
        toast.dismiss();
        toast.success(`Successfully re-seeded outbreak database with ${res.count} realistic records!`);
      } else if (res?.error) {
        toast.dismiss();
        toast.error(res.error);
      } else {
        toast.dismiss();
        toast.error("Failed to seed demo data. Admins only.");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Seeding operation failed.");
      console.error(error);
    } finally {
      setIsResetting(false);
    }
  };

  const scenarios = [
    {
      id: 1,
      emoji: "👴",
      title: "Ram Singh (62, Diabetic)",
      role: "Village Patient Triage",
      description: "Pre-fills fever + dizziness symptom inputs and opens health checker to simulate AI rural triaging.",
      href: "/?prefill=ram-singh#symptom-checker",
      color: "from-sky-500/10 to-blue-500/10 border-sky-200 text-sky-700 dark:text-sky-400 dark:border-sky-900/60"
    },
    {
      id: 2,
      emoji: "👩‍⚕️",
      title: "Dr. Priya Sharma",
      role: "Doctor Dashboard Triage",
      description: "Consult queue listing featuring video call links, scanned OCR prescription logs, and clinical AI briefing context.",
      href: "/telemedicine",
      color: "from-emerald-500/10 to-teal-500/10 border-emerald-200 text-emerald-700 dark:text-emerald-400 dark:border-emerald-900/60"
    },
    {
      id: 3,
      emoji: "🏥",
      title: "ASHA Worker Gurpreet",
      role: "ASHA Rural Family Registry",
      description: "ASHA Worker portal to register village families, schedule offline checkups, and dispatch outbreak notifications.",
      href: "/asha",
      color: "from-amber-500/10 to-orange-500/10 border-amber-200 text-amber-700 dark:text-amber-400 dark:border-amber-900/60"
    },
    {
      id: 4,
      emoji: "🦠",
      title: "Outbreak Alert",
      role: "Epidemiological Heatmap Tracker",
      description: "Surveillance dashboard highlighting Dengue spikes in Sauja village using mathematical thresholds and Leaflet mapping.",
      href: "/admin/outbreak",
      color: "from-rose-500/10 to-red-500/10 border-rose-200 text-rose-700 dark:text-rose-400 dark:border-rose-900/60"
    },
    {
      id: 5,
      emoji: "📱",
      title: "SMS Booking Demo",
      role: "Keypad Feature Phone Booking",
      description: "Interactive keypad phone simulator allowing judges to simulate booking virtual visits via standard SMS queries.",
      href: "/sms-demo",
      color: "from-indigo-500/10 to-purple-500/10 border-indigo-200 text-indigo-700 dark:text-indigo-400 dark:border-indigo-900/60"
    },
    {
      id: 6,
      emoji: "💊",
      title: "Prescription Scan",
      role: "AI Handwritten Vision OCR",
      description: "Instant multimodal vision processing scanning physically written doctor notes to pre-fill medication rows.",
      href: "/records",
      color: "from-violet-500/10 to-fuchsia-500/10 border-violet-200 text-violet-700 dark:text-violet-400 dark:border-violet-900/60"
    }
  ];

  if (!mounted) return null;

  const isAdmin = userRole === "ADMIN" || userRole === "OWNER";

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 pt-24 pb-20 min-h-[90vh]">
      
      {/* Header Block */}
      <div className="text-center space-y-3 mb-10">
        <Badge variant="outline" className="bg-sky-500/10 border-sky-400/30 px-3 py-1 text-sky-600 dark:text-sky-400 text-xs font-bold tracking-wider uppercase animate-pulse">
          🏆 Hackathon Judging Dashboard
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none text-foreground flex items-center justify-center gap-2.5">
          <Sparkles className="h-8 w-8 text-sky-500" />
          DocSaathi Guided Scenarios
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Welcome, judges! Select any of our live scenario cards below to instantly walk through DocSaathi's premium healthcare capabilities across various user endpoints.
        </p>
      </div>

      {/* 6 Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {scenarios.map((scene) => (
          <Card 
            key={scene.id} 
            className={`border bg-gradient-to-br ${scene.color} shadow-xs rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 group flex flex-col justify-between`}
          >
            <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-4xl filter drop-shadow-sm group-hover:scale-110 transition-transform">{scene.emoji}</span>
                  <div>
                    <h3 className="font-extrabold text-base leading-tight text-foreground">{scene.title}</h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{scene.role}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed leading-snug font-medium pt-1">
                  {scene.description}
                </p>
              </div>
              <Button asChild size="sm" className="w-full bg-background dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 hover:scale-102 active:scale-98 transition-all rounded-xl font-bold cursor-pointer gap-1 text-xs h-9">
                <Link href={scene.href}>
                  Launch Scenario <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Seeding Demo Control - Admin/Owner Only */}
      <Card className="border-emerald-100 dark:border-emerald-900/60 shadow-lg bg-gradient-to-br from-card to-emerald-500/5 rounded-3xl overflow-hidden mb-6">
        <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-emerald-600 dark:text-emerald-400">
              <RefreshCw className={`h-5 w-5 ${isResetting ? 'animate-spin' : ''}`} />
              <h3 className="font-extrabold text-lg sm:text-xl">Administrative Surveillance Seeding Control</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
              Clicking below will clear the Outbreak database and re-seed 60 fresh data logs (45 baseline records spread across last 9 days + 15 recent Fever/Diarrhea outbreak spikes in Sauja village over the last 48 hours) to verify epidemiological tracking.
            </p>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            {isAdmin ? (
              <Button 
                onClick={handleResetData}
                disabled={isResetting}
                className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl h-12 px-6 shadow-md shadow-emerald-500/10 cursor-pointer hover:scale-105 active:scale-95 transition-all text-sm gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
                {isResetting ? "Seeding Database..." : "Reset Outbreak Demo Data"}
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-xs font-semibold bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 p-3 rounded-2xl">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Admin privileges required to trigger DB re-seeding actions.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Offline Mode Simulator Card */}
      <Card className="border-amber-100 dark:border-amber-900/60 shadow-lg bg-gradient-to-br from-card to-amber-500/5 rounded-3xl overflow-hidden">
        <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-amber-600 dark:text-amber-400">
              <Wifi className="h-5 w-5" />
              <h3 className="font-extrabold text-lg sm:text-xl">Offline Capabilities Demo Simulator</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
              Clicking below will force-simulate an offline status in the browser for 5 seconds. You can quickly switch to the ASHA Worker page, register a family member, and watch the app save locally and queue it for background sync seamlessly!
            </p>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <Button 
              onClick={() => {
                toast.success("Simulating offline mode... Window is now OFFLINE!");
                window.dispatchEvent(new Event("offline"));
                setTimeout(() => {
                  toast.success("Connection restored! Syncing queued offline items...");
                  window.dispatchEvent(new Event("online"));
                }, 5000);
              }}
              className="w-full md:w-auto bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl h-12 px-6 shadow-md shadow-amber-500/10 cursor-pointer hover:scale-105 active:scale-95 transition-all text-sm gap-2"
            >
              Simulate 5s Offline Mode
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
