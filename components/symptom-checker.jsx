"use client";

import { useState } from "react";
import { 
  Activity, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Stethoscope, 
  Thermometer, 
  Wind, 
  Brain, 
  Heart,
  ChevronRight,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { analyzeSymptoms } from "@/actions/ai";
import { SymptomGrid } from "./symptom-grid";
import { FacilityFinder } from "./facility-finder";

const ALL_SYMPTOMS_LOOKUP = [
  { id: "fever", label: "Fever" },
  { id: "headache", label: "Headache" },
  { id: "cough", label: "Cough" },
  { id: "vomiting", label: "Vomiting" },
  { id: "diarrhea", label: "Diarrhea" },
  { id: "chest_pain", label: "Chest Pain" },
  { id: "stomach_pain", label: "Stomach Pain" },
  { id: "dizziness", label: "Dizziness" },
  { id: "fatigue", label: "Fatigue" },
  { id: "sore_throat", label: "Sore Throat" },
  { id: "rash", label: "Rash" },
  { id: "joint_pain", label: "Joint Pain" },
  { id: "breathlessness", label: "Breathlessness" },
  { id: "nausea", label: "Nausea" },
  { id: "back_pain", label: "Back Pain" },
];

export default function SymptomChecker() {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [language, setLanguage] = useState("English");
  const [duration, setDuration] = useState("Today");
  const [patientType, setPatientType] = useState("Adult");
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const LANGUAGES = ["English", "Hindi", "Bengali", "Tamil"];
  const DURATIONS = ["Today", "2-3 days", "1 week", "More than 1 week"];
  const PATIENT_TYPES = ["Adult", "Child", "Elderly", "Pregnant"];

  const removeSymptom = (id) => {
    setSelectedSymptoms(prev => prev.filter(s => s !== id));
  };

  const handleAnalyze = async () => {
    if (selectedSymptoms.length === 0 && !customSymptom.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const selectedLabels = selectedSymptoms.map(id => ALL_SYMPTOMS_LOOKUP.find(s => s.id === id)?.label);
      const allSymptoms = [...selectedLabels, customSymptom].filter(Boolean);
      
      const result = await analyzeSymptoms({
        symptoms: allSymptoms,
        language,
        patientType,
        duration
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setReport(result.data);
    } catch (err) {
      console.error("Symptom checker error:", err);
      setError(err.message || "Failed to analyze symptoms. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };


  const reset = () => {
    setSelectedSymptoms([]);
    setCustomSymptom("");
    setReport(null);
    setError(null);
    setDuration("Today");
    setPatientType("Adult");
  };

  return (
    <section id="symptom-checker" className="py-24 bg-sky-50/50 dark:bg-sky-950/10">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl md:text-5xl font-black text-sky-600 tracking-tight text-center md:text-left">
                Symptom Checker
              </h2>
              <p className="text-slate-500 font-medium mt-2 text-center md:text-left">
                Get an instant health assessment and triage advice.
              </p>
            </div>
          </div>

          <Card className="border-none bg-white dark:bg-slate-900 shadow-2xl shadow-sky-900/5 rounded-[2.5rem] overflow-hidden">
            {!report ? (
              <div className="p-6 sm:p-10">
                {/* Instruction */}
                <div className="mb-8 flex items-center gap-3">
                  <div className="p-3 bg-sky-50 dark:bg-sky-900/20 rounded-2xl">
                    <Activity className="h-6 w-6 text-sky-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                    What are your symptoms?
                  </h3>
                </div>

                {/* SymptomGrid */}
                <div className="mb-10">
                  <SymptomGrid 
                    initialSelected={selectedSymptoms}
                    onChange={(labels) => {
                      const newIds = labels.map(label => 
                        ALL_SYMPTOMS_LOOKUP.find(s => s.label === label)?.id
                      ).filter(Boolean);
                      setSelectedSymptoms(newIds);
                    }} 
                  />
                </div>

                {/* Custom Input */}
                <div className="space-y-4 mb-10">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Other Details</h4>
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    <Input 
                      placeholder="Describe any other symptoms or pain..." 
                      className="pl-14 h-16 text-lg rounded-2xl border-2 border-slate-50 focus-visible:ring-sky-600 bg-slate-50/50 dark:bg-slate-800/30"
                      value={customSymptom}
                      onChange={(e) => setCustomSymptom(e.target.value)}
                    />
                  </div>
                </div>

                {/* Selected Symptoms Tags */}
                {selectedSymptoms.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-10">
                    {selectedSymptoms.map((id) => {
                      const symptom = ALL_SYMPTOMS_LOOKUP.find(s => s.id === id);
                      return (
                        <Badge 
                          key={id} 
                          className="bg-sky-50 text-sky-600 border-sky-100 px-4 py-2 rounded-xl flex items-center gap-2 transition-all hover:scale-105"
                        >
                          {symptom?.label}
                          <button onClick={() => removeSymptom(id)} className="text-sky-600/50 hover:text-red-500">
                            <AlertCircle className="h-4 w-4 rotate-45" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 border-t border-slate-50 pt-10">
                  {/* Duration Selector */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Duration</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {DURATIONS.map((d) => (
                        <button
                          key={d}
                          onClick={() => setDuration(d)}
                          className={cn(
                            "p-3 rounded-xl text-xs font-bold border-2 transition-all",
                            duration === d 
                              ? "border-sky-600 bg-sky-50 text-sky-600" 
                              : "border-slate-50 text-slate-400 hover:border-sky-100"
                          )}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Patient Type Selector */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Patient Type</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {PATIENT_TYPES.map((type) => (
                        <button
                          key={type}
                          onClick={() => setPatientType(type)}
                          className={cn(
                            "p-3 rounded-xl text-xs font-bold border-2 transition-all",
                            patientType === type 
                              ? "border-sky-600 bg-sky-50 text-sky-600" 
                              : "border-slate-50 text-slate-400 hover:border-sky-100"
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex flex-col items-center gap-4">
                  <Button 
                    onClick={handleAnalyze} 
                    disabled={(selectedSymptoms.length === 0 && !customSymptom.trim()) || isAnalyzing}
                    className="w-full h-14 sm:h-16 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-lg sm:text-xl font-black shadow-xl shadow-sky-500/20 transition-all active:scale-95 disabled:grayscale"
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span>Analyzing Symptoms...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span>Check My Symptoms</span>
                        <ArrowRight className="h-6 w-6" />
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* Result Area */
              <div className="animate-in fade-in zoom-in-95 duration-1000">
                {/* Error Box */}
                {error && (
                  <div className="m-8 p-6 bg-red-50 border-red-500/20 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4">
                    <div className="h-10 w-10 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
                      <AlertCircle className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-red-500">{error}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setError(null)} className="text-red-400 hover:bg-red-500/10">Dismiss</Button>
                  </div>
                )}

                {/* Medical Report */}
                {report && (
                  <div className="p-8 sm:p-14">
                    {(() => {
                        const fullReport = typeof report === 'string' ? report : "";
                        const urgencyMatch = fullReport.match(/URGENCY:\s*(\w+)/i);
                        const level = urgencyMatch ? urgencyMatch[1].toUpperCase() : "";
                        
                        const isError = level.includes("ERROR") || level.includes("FAILED");
                        const isRed = !isError && (level === "RED" || level === "EMERGENCY" || level === "CRITICAL" || fullReport.toUpperCase().includes("URGENCY: RED"));
                        const isYellow = !isError && !isRed && (level === "YELLOW" || level.includes("24") || fullReport.toUpperCase().includes("URGENCY: YELLOW"));
                        const isGreen = !isError && !isRed && !isYellow && (level === "GREEN" || level === "NORMAL" || fullReport.toUpperCase().includes("URGENCY: GREEN"));
                        
                        const theme = isError
                          ? { bg: "bg-slate-100 dark:bg-slate-950/40", border: "border-slate-200 dark:border-slate-800", title: "text-slate-600 dark:text-slate-400", accent: "#64748b" }
                          : isRed 
                          ? { bg: "bg-red-500/10 dark:bg-red-500/20", border: "border-red-500/30", title: "text-red-600 dark:text-red-400", accent: "#ef4444" }
                          : isYellow
                          ? { bg: "bg-amber-500/10 dark:bg-amber-500/20", border: "border-amber-500/30", title: "text-amber-600 dark:text-amber-400", accent: "#f59e0b" }
                          : isGreen
                          ? { bg: "bg-emerald-500/10 dark:bg-emerald-500/20", border: "border-emerald-500/30", title: "text-emerald-600 dark:text-emerald-400", accent: "#10b981" }
                          : { bg: "bg-sky-500/5 dark:bg-sky-500/10", border: "border-sky-500/20", title: "text-sky-600 dark:text-sky-400", accent: "#0ea5e9" };

                        return (
                          <>
                            <div className={cn(
                              "rounded-[3rem] p-8 sm:p-12 border-2 transition-all duration-1000",
                              theme.bg,
                              theme.border
                            )}>
                              <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10 pb-10 border-b border-slate-200/50 dark:border-slate-800/50">
                                <div className={cn(
                                  "w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 shadow-xl transition-all duration-500",
                                  isError ? "bg-slate-300 dark:bg-slate-700" : isRed ? "bg-red-500" : isYellow ? "bg-amber-500" : isGreen ? "bg-emerald-500" : "bg-sky-500"
                                )}>
                                  {isError ? (
                                    <X className="h-10 w-10 text-white" />
                                  ) : (
                                    <CheckCircle2 className="h-10 w-10 text-white" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <Badge className={cn(
                                    "text-[11px] font-black uppercase py-0.5 px-3 border-0 rounded-lg",
                                    isError ? "bg-slate-500 text-white" : isRed ? "bg-red-500 text-white" : isYellow ? "bg-amber-500 text-white" : isGreen ? "bg-emerald-500 text-white" : "bg-sky-500 text-white"
                                  )}>
                                    {isError ? "Analysis Error" : isRed ? "Critical Urgency" : isYellow ? "Urgent Care" : isGreen ? "Standard Triage" : "Status Unknown"}
                                  </Badge>
                                  <h2 className={cn("text-2xl sm:text-3xl font-black mt-3 leading-tight tracking-tight", theme.title)}>
                                    {isError 
                                      ? "System Analysis Failed" 
                                      : isRed 
                                      ? "Immediate Medical Attention Required" 
                                      : isYellow 
                                      ? "Medical Consultation Advised" 
                                      : isGreen
                                      ? "Condition Appears Non-Urgent"
                                      : "Triage Status: Standard Care"}
                                  </h2>
                                </div>
                                <div className={cn("hidden md:block h-12 w-12 rounded-full border-4 border-slate-200/20 flex items-center justify-center animate-pulse", isRed ? "bg-red-500/20" : isYellow ? "bg-amber-500/20" : isGreen ? "bg-emerald-500/20" : "bg-sky-500/20")}>
                                   <div className={cn("h-4 w-4 rounded-full", isError ? "bg-slate-400" : isRed ? "bg-red-500" : isYellow ? "bg-amber-500" : isGreen ? "bg-emerald-500" : "bg-sky-500")} />
                                </div>
                              </div>

                              <div className="flex items-center justify-between mb-8 opacity-60">
                                <p className={cn("text-[11px] font-black uppercase tracking-[0.4em]", theme.title)}>
                                  Detailed Medical Report
                                </p>
                              </div>
                            <div className="space-y-2">
                              {report.split("\n").map((line, i) => (
                                <p key={i} className="text-base sm:text-lg leading-relaxed text-slate-700 dark:text-slate-300" style={{
                                  fontWeight: line.includes(":") && line === line.toUpperCase() 
                                    ? "900" : "450",
                                  color: line.toUpperCase().includes("URGENCY") ? theme.accent :
                                         line.toUpperCase().includes("WARNING") ? "#ef4444" :
                                         line.toUpperCase().includes("DISCLAIMER") ? "#94a3b8" :
                                         "inherit",
                                  marginBottom: line.includes(":") && line === line.toUpperCase() ? "20px" : "6px",
                                  marginTop: line.includes(":") && line === line.toUpperCase() ? "24px" : "0px",
                                  letterSpacing: line.includes(":") && line === line.toUpperCase() ? "-0.02em" : "normal"
                                }}>
                                  {line}
                                </p>
                              ))}
                            </div>
                            <div className="mt-16 pt-10 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                              <Button 
                                onClick={reset} 
                                className="h-16 px-10 rounded-2xl font-black text-slate-800 dark:text-white hover:scale-105 active:scale-95 transition-all shadow-xl"
                              >
                                Start New Assessment
                              </Button>
                              <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">DocSaathi Medical</p>
                                <p className="text-[8px] text-slate-300">Confidential AI Report</p>
                              </div>
                            </div>
                          </div>
                          
                          {(isRed || isYellow) && (
                            <div className="mt-12 animate-in slide-in-from-bottom-8 duration-1000">
                              <FacilityFinder />
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
