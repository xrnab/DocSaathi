"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Users, Stethoscope, Heart, Activity, MessageSquare, Pill, Sparkles, Loader2, Award, Calendar, BarChart3
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function LiveStatsDialog() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/live-stats");
      const data = await res.json();
      if (data.success) {
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching live statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen]);

  const displayStats = {
    patients: stats ? stats.totalPatients : 0,
    doctors: stats ? stats.totalDoctors : 0,
    consultations: stats ? stats.totalAppointments : 0,
    families: stats ? stats.totalFamilies : 0,
    outbreaks: stats ? stats.totalOutbreakReports : 0,
    vaccinations: stats ? stats.totalVaccinations : 0,
    symptomChecks: stats ? stats.totalSymptomChecks : 0,
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="fixed bottom-40 right-4 sm:bottom-6 sm:right-48 z-40 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-4 h-12 w-32 sm:h-14 sm:w-36 font-black shadow-2xl hover:scale-105 active:scale-95 transition-all text-xs sm:text-sm gap-2 border border-emerald-500/20 animate-in fade-in duration-300"
        >
          <BarChart3 className="h-5 w-5 animate-pulse text-emerald-100" />
          <span>📊 Impact</span>
          <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl rounded-3xl border-slate-200/80 dark:border-slate-800 bg-background/98 dark:bg-slate-950/98 p-6 shadow-2xl backdrop-blur-xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full select-none flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              Live Impact Registry
            </Badge>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
              Nabha Regional Hub
            </span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2 pt-2">
            <Award className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            DocSaathi Dynamic Impact
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Real-time verified health stats logged directly in our decentralized databases across ASHA workers, clinical specialist consultation channels, and patient registries.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
            <span className="text-xs text-muted-foreground font-semibold animate-pulse">Retrieving live impact counts...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 pt-4">
            
            {/* Stat: Completed Consults */}
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold text-emerald-700 dark:text-emerald-300 tracking-wider">Tele-Consults</span>
                <Activity className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="pt-3">
                <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{displayStats.consultations}</h3>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold mt-0.5">Completed consultations</p>
              </div>
            </div>

            {/* Stat: Registered Families */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold text-amber-700 dark:text-amber-300 tracking-wider">ASHA Families</span>
                <Heart className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="pt-3">
                <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{displayStats.families}</h3>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold mt-0.5">Registered family profiles</p>
              </div>
            </div>

            {/* Stat: Outbreaks Surveillance */}
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold text-rose-700 dark:text-rose-300 tracking-wider">Outbreak Alerts</span>
                <Sparkles className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="pt-3">
                <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{displayStats.outbreaks}</h3>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold mt-0.5">Surveillance logs filed</p>
              </div>
            </div>

            {/* Stat: Vaccinations Tracked */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold text-blue-700 dark:text-blue-300 tracking-wider">Immunisations</span>
                <Pill className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="pt-3">
                <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{displayStats.vaccinations}</h3>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold mt-0.5">Vaccinations tracked</p>
              </div>
            </div>

            {/* Sub-registry elements */}
            <div className="col-span-2 border-t border-slate-200 dark:border-slate-800/80 pt-4 mt-2">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] px-1 text-slate-600 dark:text-slate-300 font-black">
                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/50 px-3 py-2 rounded-full border border-slate-200/50 dark:border-slate-800/50 w-full sm:w-auto justify-center select-none shadow-2xs">
                  <Users className="h-3.5 w-3.5 text-slate-500" /> Patients: <strong className="text-foreground">{displayStats.patients}</strong>
                </span>
                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/50 px-3 py-2 rounded-full border border-slate-200/50 dark:border-slate-800/50 w-full sm:w-auto justify-center select-none shadow-2xs">
                  <Stethoscope className="h-3.5 w-3.5 text-slate-500" /> Verified Doctors: <strong className="text-foreground">{displayStats.doctors}</strong>
                </span>
                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/50 px-3 py-2 rounded-full border border-slate-200/50 dark:border-slate-800/50 w-full sm:w-auto justify-center select-none shadow-2xs">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" /> Checks: <strong className="text-foreground">{displayStats.symptomChecks}</strong>
                </span>
              </div>
            </div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
