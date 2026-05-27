"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
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
  ChevronDown,
  ChevronUp,
  Loader2,
  Mic,
  MicOff,
  X
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
  // Rural-relevant symptoms
  { id: "pesticide_exposure", label: "Pesticide Exposure" },
  { id: "snake_scorpion_bite", label: "Snake/Scorpion Bite" },
  { id: "heat_stroke", label: "Heat Stroke" },
  { id: "eye_irritation", label: "Eye Irritation (Stubble Burning)" },
  { id: "muscle_cramps", label: "Muscle Cramps (Farm Labor)" },
  { id: "waterborne_illness", label: "Waterborne Illness" },
];

export default function SymptomChecker() {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [language, setLanguage] = useState("Punjabi");
  const [isListening, setIsListening] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSeen = localStorage.getItem("has_seen_voice_tooltip");
      if (!hasSeen) {
        setShowTooltip(true);
      }
    }
  }, []);

  const dismissTooltip = () => {
    setShowTooltip(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("has_seen_voice_tooltip", "true");
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      if (language === "Punjabi") {
        recognition.lang = "pa-IN";
      } else if (language === "Hindi") {
        recognition.lang = "hi-IN";
      } else if (language === "English") {
        recognition.lang = "en-IN";
      } else {
        recognition.lang = "pa-IN";
      }

      recognition.onstart = () => {
        setIsListening(true);
        toast.info(`Voice search activated. Speak in ${language}...`);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          toast.error("Microphone access denied. Please check browser permissions.");
        } else {
          toast.error("Could not capture speech. Please try again.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setCustomSymptom(prev => prev ? prev + " " + transcript : transcript);
          toast.success("Voice symptoms added!");
          dismissTooltip();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition start failed:", err);
      setIsListening(false);
      toast.error("Failed to start voice capture.");
    }
  };
  const [duration, setDuration] = useState("Today");
  const [patientType, setPatientType] = useState("Adult");
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSymptomsOpen, setIsSymptomsOpen] = useState(false);

  const LANGUAGES = ["Punjabi", "English", "Hindi", "Bengali", "Tamil"];
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
    <section id="symptom-checker" className="py-16 sm:py-24 bg-sky-50/50 dark:bg-sky-950/10">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 sm:mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-sky-600 tracking-tight text-center md:text-left">
                Symptom Checker
              </h2>
              <p className="text-sm sm:text-base text-slate-500 font-medium mt-2 text-center md:text-left">
                Get an instant health assessment and triage advice.
              </p>
            </div>
          </div>

          <Card className="border-none bg-white dark:bg-slate-900 shadow-2xl shadow-sky-900/5 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
            {!report ? (
              <div className="p-4 sm:p-10">
                {/* Dropdown for Symptoms */}
                <div className="mb-8 sm:mb-10">
                  <button 
                    type="button"
                    onClick={() => setIsSymptomsOpen(!isSymptomsOpen)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 bg-sky-50/50 dark:bg-sky-900/10 rounded-xl sm:rounded-2xl border border-sky-100 dark:border-sky-800/50 hover:bg-sky-100/50 dark:hover:bg-sky-900/20 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-sky-100 dark:bg-sky-800 rounded-lg group-hover:scale-110 transition-transform">
                        <Activity className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 leading-none">
                          {selectedSymptoms.length > 0 ? `${selectedSymptoms.length} Symptoms Selected` : "What are your symptoms?"}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Select from common health issues</p>
                      </div>
                    </div>
                    {isSymptomsOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                  </button>

                  {isSymptomsOpen && (
                    <div className="mt-4 p-4 bg-slate-50/30 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2 duration-300">
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
                  )}
                </div>

                {/* Custom Input */}
                <div className="space-y-4 mb-8 sm:mb-10">
                  <h4 className="text-[10px] sm:text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Other Details</h4>
                  <div className="relative">
                    <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-300" />
                    <Input 
                      placeholder="Describe symptoms..." 
                      className="pl-10 sm:pl-14 pr-12 sm:pr-16 h-12 sm:h-16 text-sm sm:text-lg rounded-xl sm:rounded-2xl border-2 border-slate-50 focus-visible:ring-sky-600 bg-slate-50/50 dark:bg-slate-800/30"
                      value={customSymptom}
                      onChange={(e) => setCustomSymptom(e.target.value)}
                    />
                    
                    {/* Voice Input Button */}
                    <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex items-center">
                      {showTooltip && (
                        <div className="absolute bottom-full right-0 mb-3 w-64 sm:w-72 bg-sky-600 dark:bg-sky-700 text-white text-[10px] sm:text-xs font-bold px-3 py-2 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 z-30">
                          <div className="relative flex items-start gap-2">
                            <span>🎙️ Tap and speak in Punjabi or Hindi</span>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                dismissTooltip();
                              }}
                              className="ml-auto text-white/70 hover:text-white font-extrabold text-xs sm:text-sm leading-none shrink-0"
                            >
                              ✕
                            </button>
                            <div className="absolute top-full right-4 -translate-y-1.5 w-3 h-3 bg-sky-600 dark:bg-sky-700 rotate-45" />
                          </div>
                        </div>
                      )}
                      
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={cn(
                          "p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 flex items-center justify-center cursor-pointer",
                          isListening 
                            ? "bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]" 
                            : "bg-sky-50 hover:bg-sky-100 text-sky-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-sky-400"
                        )}
                        title="Voice Input (Punjabi / Hindi)"
                      >
                        {isListening ? (
                          <MicOff className="h-4 w-4 sm:h-5 sm:w-5 animate-bounce" />
                        ) : (
                          <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Selected Symptoms Tags */}
                {selectedSymptoms.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8 sm:mb-10">
                    {selectedSymptoms.map((id) => {
                      const symptom = ALL_SYMPTOMS_LOOKUP.find(s => s.id === id);
                      return (
                        <Badge 
                          key={id} 
                          className="bg-sky-50 text-sky-600 border-sky-100 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2 transition-all hover:scale-105"
                        >
                          <span className="text-[10px] sm:text-sm">{symptom?.label}</span>
                          <button onClick={() => removeSymptom(id)} className="text-sky-600/50 hover:text-red-500">
                            <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 rotate-45" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10 border-t border-slate-50 pt-8 sm:pt-10">
                  {/* Duration Selector */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] sm:text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Duration</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {DURATIONS.map((d) => (
                        <button
                          key={d}
                          onClick={() => setDuration(d)}
                          className={cn(
                            "p-2.5 sm:p-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold border-2 transition-all",
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
                    <h4 className="text-[10px] sm:text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Patient Type</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {PATIENT_TYPES.map((type) => (
                        <button
                          key={type}
                          onClick={() => setPatientType(type)}
                          className={cn(
                            "p-2.5 sm:p-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold border-2 transition-all",
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
                    className="w-full h-14 sm:h-16 bg-sky-600 hover:bg-sky-700 text-white rounded-xl sm:rounded-2xl text-base sm:text-xl font-black shadow-xl shadow-sky-500/20 transition-all active:scale-95 disabled:grayscale"
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                        <span className="text-sm sm:text-base">Analyzing Symptoms...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-sm sm:text-base">Check My Symptoms</span>
                        <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
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
                  <div className="m-4 sm:m-8 p-4 sm:p-6 bg-red-50 border-red-500/20 rounded-2xl sm:rounded-3xl flex items-center gap-3 sm:gap-4 animate-in slide-in-from-top-4">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 bg-red-500 rounded-lg sm:rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 shrink-0">
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-red-500 truncate">{error}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setError(null)} className="text-red-400 hover:bg-red-500/10 shrink-0 h-8 text-[10px] sm:text-xs">Dismiss</Button>
                  </div>
                )}

                {/* Medical Report */}
                {report && (
                  <div className="p-4 sm:p-14">
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
                              "rounded-[1.5rem] sm:rounded-[3rem] p-4 sm:p-12 border transition-all duration-1000",
                              theme.bg,
                              theme.border
                            )}>
                              <div className="flex flex-col md:flex-row md:items-center gap-4 sm:gap-6 mb-6 sm:mb-10 pb-6 sm:pb-10 border-b border-slate-200/50 dark:border-slate-800/50">
                                <div className={cn(
                                  "w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-3xl flex items-center justify-center shrink-0 shadow-xl transition-all duration-500 mx-auto md:mx-0",
                                  isError ? "bg-slate-300 dark:bg-slate-700" : isRed ? "bg-red-500" : isYellow ? "bg-amber-500" : isGreen ? "bg-emerald-500" : "bg-sky-500"
                                )}>
                                  {isError ? (
                                    <X className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                                  ) : (
                                    <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                                  )}
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                  <Badge className={cn(
                                    "text-[9px] sm:text-[11px] font-black uppercase py-0.5 px-2 sm:px-3 border-0 rounded-lg",
                                    isError ? "bg-slate-500 text-white" : isRed ? "bg-red-500 text-white" : isYellow ? "bg-amber-500 text-white" : isGreen ? "bg-emerald-500 text-white" : "bg-sky-500 text-white"
                                  )}>
                                    {isError ? "Analysis Error" : isRed ? "Critical Urgency" : isYellow ? "Urgent Care" : isGreen ? "Standard Triage" : "Status Unknown"}
                                  </Badge>
                                  <h2 className={cn("text-lg sm:text-2xl md:text-3xl font-black mt-2 sm:mt-3 leading-tight tracking-tight", theme.title)}>
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

                              <div className="flex items-center justify-between mb-4 sm:mb-8 opacity-60">
                                <p className={cn("text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em]", theme.title)}>
                                  Detailed Medical Report
                                </p>
                              </div>
                            <div className="space-y-2">
                              {report.split("\n").map((line, i) => (
                                <p key={i} className="text-sm sm:text-base md:text-lg leading-relaxed text-slate-700 dark:text-slate-300" style={{
                                  fontWeight: line.includes(":") && line === line.toUpperCase() 
                                    ? "900" : "450",
                                  color: line.toUpperCase().includes("URGENCY") ? theme.accent :
                                         line.toUpperCase().includes("WARNING") ? "#ef4444" :
                                         line.toUpperCase().includes("DISCLAIMER") ? "#94a3b8" :
                                         "inherit",
                                  marginBottom: line.includes(":") && line === line.toUpperCase() ? "12px" : "4px",
                                  marginTop: line.includes(":") && line === line.toUpperCase() ? "16px" : "0px",
                                  letterSpacing: line.includes(":") && line === line.toUpperCase() ? "-0.01em" : "normal"
                                }}>
                                  {line}
                                </p>
                              ))}
                            </div>
                            <div className="mt-8 sm:mt-16 pt-6 sm:pt-10 border-t border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-6">
                              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 w-full lg:w-auto">
                                <Button 
                                  onClick={reset} 
                                  className="h-12 sm:h-16 px-6 sm:px-8 rounded-xl sm:rounded-2xl font-black text-slate-800 dark:text-white hover:scale-105 active:scale-95 transition-all shadow-xl text-xs sm:text-base"
                                >
                                  Start New Assessment
                                </Button>
                                <Button 
                                  asChild
                                  className="h-12 sm:h-16 px-6 sm:px-8 rounded-xl sm:rounded-2xl font-black bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2 cursor-pointer text-xs sm:text-base"
                                >
                                  <a 
                                    href={`https://wa.me/?text=${encodeURIComponent(
                                      `DocSaathi Triage Assessment Report:\n\n` + 
                                      (typeof report === 'string' ? report.substring(0, 700) : '') + 
                                      `\n\nConsult a doctor immediately. Get care at: ${typeof window !== 'undefined' ? window.location.origin : ''}`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Share on WhatsApp
                                  </a>
                                </Button>
                              </div>
                              <div className="text-center lg:text-right shrink-0">
                                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 sm:mb-1">DocSaathi Medical</p>
                                <p className="text-[7px] sm:text-[8px] text-slate-300 uppercase">Confidential AI Report</p>
                              </div>
                            </div>
                          </div>
                          
                          {(isRed || isYellow) && (
                            <div className="mt-8 sm:mt-12 animate-in slide-in-from-bottom-8 duration-1000">
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
