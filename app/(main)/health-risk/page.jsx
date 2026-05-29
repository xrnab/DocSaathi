"use client";

import { useState, useEffect } from "react";
import { generateHealthRiskReport } from "@/actions/ai";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  HeartPulse, 
  AlertTriangle, 
  Check, 
  RotateCcw, 
  Stethoscope, 
  ShieldAlert, 
  Activity, 
  Loader2,
  Droplet,
  Info
} from "lucide-react";
import Link from "next/link";

function RiskScoreCard({ title, score, level, reason }) {
  const colors = {
    LOW: "text-emerald-700 bg-emerald-500/5 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/30",
    MEDIUM: "text-amber-700 bg-amber-500/5 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/30",
    HIGH: "text-rose-700 bg-rose-500/5 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/30"
  };
  const badgeColors = {
    LOW: "border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
    MEDIUM: "border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30",
    HIGH: "border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30"
  };
  const barColors = { LOW: "bg-emerald-500", MEDIUM: "bg-amber-500", HIGH: "bg-rose-500" };

  return (
    <div className={`rounded-2xl border p-5 space-y-4 hover:shadow-md transition-all duration-300 ${colors[level]}`}>
      <div className="flex items-center justify-between">
        <span className="font-extrabold text-sm text-foreground">{title}</span>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeColors[level]}`}>
          {level}
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-muted-foreground">
          <span>Risk Probability</span>
          <span className="font-bold text-foreground">{score}/100</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ${barColors[level]}`} 
            style={{ width: `${score}%` }} 
          />
        </div>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground font-medium">{reason}</p>
    </div>
  );
}

export default function HealthRiskDashboard() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generateHealthRiskReport();
      if (res.error) {
        setError(res.error);
      } else if (res.success) {
        setReport(res.report);
      } else {
        setError("Could not generate report. Please complete your profile first.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-20 px-4 sm:px-0">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-5 text-center">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-sky-500/20 border-t-sky-500 animate-spin" />
            <HeartPulse className="h-6 w-6 text-sky-500 absolute top-5 left-5 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground animate-pulse">Analyzing your health data...</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Evaluating BMI, prescriptions, and recent doctor checkups to compile preventive insights.
            </p>
          </div>
          
          {/* Skeleton Cards Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl pt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse border border-border p-5 rounded-2xl space-y-4">
                <div className="flex justify-between">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded-full w-12" />
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-muted rounded w-full" />
                  <div className="h-2 bg-muted rounded w-2/3" />
                </div>
                <div className="h-3 bg-muted rounded w-5/6" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <Card className="border-red-200 bg-red-500/5 p-6 rounded-3xl text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-950/20 rounded-full flex items-center justify-center text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg font-bold">Failed to Generate Assessment</CardTitle>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {error === "User not found" 
              ? "We couldn't find your profile. Make sure you complete your patient onboarding first."
              : error}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button onClick={fetchReport} className="bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl gap-2 cursor-pointer">
              <RotateCcw className="h-4 w-4" /> Retry Analysis
            </Button>
            <Button asChild variant="outline" className="border-border rounded-xl">
              <Link href="/patients/onboarding">Complete Onboarding</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const urgentFlags = report?.urgentFlags || [];
  const topRecommendations = report?.topRecommendations || [];
  const isBmiAvailable = report?.bmi?.value != null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 px-4 sm:px-0 animate-in fade-in duration-500">
      
      {/* Header Container */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground flex items-center gap-2">
            <HeartPulse className="h-8 w-8 text-rose-500 animate-pulse shrink-0" />
            AI Health Risk Assessment
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Personalized, preventive chronic condition triage report for rural communities.
          </p>
        </div>
        
        <Badge variant="outline" className="border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 text-[10px] font-black uppercase tracking-wider py-1.5 px-3 rounded-full shrink-0">
          ✨ Generated by AI — Not a Medical Diagnosis
        </Badge>
      </div>

      {/* Urgent Warning Alerts Box */}
      {urgentFlags.length > 0 && (
        <Card className="border-red-200 dark:border-red-950 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-950/5 p-5 rounded-2xl shadow-xs overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600"></div>
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-red-500/10 rounded-xl text-red-600 dark:text-red-400 shrink-0">
              <ShieldAlert className="h-5 w-5 animate-bounce" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h4 className="text-sm font-extrabold text-red-900 dark:text-red-400">Urgent Medical Notice</h4>
              <ul className="list-disc pl-4 text-xs font-semibold text-red-800 dark:text-red-300 space-y-1">
                {urgentFlags.map((flag, idx) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
              <p className="text-[11px] text-red-600/80 dark:text-red-400/80 font-bold mt-2">
                ⚠️ Please book a priority checkup with a qualified medical specialist immediately.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Main Grid: Chronic Risks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RiskScoreCard 
          title="Diabetes Risk"
          score={report?.diabetesRisk?.score || 0}
          level={report?.diabetesRisk?.level || "LOW"}
          reason={report?.diabetesRisk?.reason || "No factors detected."}
        />
        <RiskScoreCard 
          title="Hypertension Risk"
          score={report?.hypertensionRisk?.score || 0}
          level={report?.hypertensionRisk?.level || "LOW"}
          reason={report?.hypertensionRisk?.reason || "No factors detected."}
        />
        <RiskScoreCard 
          title="Cardiovascular Risk"
          score={report?.cardiovascularRisk?.score || 0}
          level={report?.cardiovascularRisk?.level || "LOW"}
          reason={report?.cardiovascularRisk?.reason || "No factors detected."}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left: BMI and Summary */}
        <div className="space-y-6">
          {/* BMI Card */}
          <Card className="border-sky-100 dark:border-sky-900 shadow-sm bg-card rounded-2xl overflow-hidden">
            <CardHeader className="bg-sky-50/50 dark:bg-sky-950/20 border-b border-border pb-3.5">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-sky-500" />
                Body Mass Index (BMI)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 font-black text-2xl flex items-center justify-center">
                  {isBmiAvailable ? report.bmi.value : "—"}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider leading-none">Weight Category</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-foreground">{report?.bmi?.category || "Unknown"}</span>
                    <Badge variant="outline" className="text-[9px] uppercase border-sky-300 text-sky-600 dark:text-sky-400 bg-sky-50/30">
                      Healthy range: 18.5 - 24.9
                    </Badge>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Maintaining a stable weight reduces the onset of metabolic, blood pressure, and cardiovascular strain.
              </p>
            </CardContent>
          </Card>

          {/* Overall Health Summary */}
          <Card className="border-border bg-muted/20 dark:bg-muted/5 shadow-none rounded-2xl">
            <CardContent className="p-5 space-y-2">
              <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">AI Overall Health Summary</span>
              <p className="text-sm font-semibold text-foreground italic leading-relaxed">
                "{report?.summary || "No specific patterns observed. Maintain a consistent checkup schedule."}"
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right: Preventive Actions */}
        <Card className="border-emerald-100 dark:border-emerald-950/40 bg-card shadow-xs rounded-2xl">
          <CardHeader className="bg-emerald-500/5 border-b border-emerald-100 dark:border-emerald-950/20 pb-3.5">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Check className="h-4.5 w-4.5 text-emerald-500" />
              AI Preventive Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {topRecommendations.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No recommendations required. Maintain a balanced diet.</p>
            ) : (
              <div className="space-y-4">
                {topRecommendations.map((rec, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <span className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-muted-foreground leading-relaxed flex-1">
                      {rec}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-900/30 border border-border/80 p-5 rounded-2xl">
        <div className="flex items-center gap-2">
          <Button onClick={fetchReport} className="bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl gap-2 cursor-pointer shadow-sm shadow-sky-500/10">
            <RotateCcw className="h-4 w-4 animate-pulse" /> Regenerate Report
          </Button>
        </div>
        <Link href="/doctors" className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-sky-600 dark:text-sky-400 hover:underline">
          <Stethoscope className="w-4 h-4 shrink-0" />
          Book a Doctor Consultation now →
        </Link>
      </div>

      {/* Core Medical Disclaimer */}
      <div className="flex gap-2 p-4 bg-muted/40 rounded-xl border border-border/50 text-[10px] text-muted-foreground select-none leading-relaxed">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-sky-500" />
        <span>
          <strong>General Disclaimer:</strong> This health risk dashboard provides an AI-generated assessment based on your self-reported profile metrics. It is not an alternate to a professional medical diagnosis, test, or treatment. Always consult a qualified physician or clinical practitioner to address chronic symptoms or medical emergencies.
        </span>
      </div>
    </div>
  );
}
