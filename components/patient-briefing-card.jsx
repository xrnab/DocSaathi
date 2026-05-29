"use client";

import { useState, useEffect } from "react";
import { generatePatientBriefing } from "@/actions/telemedicine";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Activity, Calendar, AlertTriangle, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PatientBriefingCard({ appointmentId }) {
  const [loading, setLoading] = useState(true);
  const [briefingText, setBriefingText] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadBriefing() {
      if (!appointmentId) return;
      
      setLoading(true);
      setError("");
      try {
        const result = await generatePatientBriefing(appointmentId);
        if (result.error) {
          setError(result.error);
        } else {
          setBriefingText(result.briefing || "");
        }
      } catch (err) {
        console.error("Briefing retrieval error:", err);
        setError("An unexpected error occurred while generating patient briefing.");
      } finally {
        setLoading(false);
      }
    }
    loadBriefing();
  }, [appointmentId]);

  const handleCopy = () => {
    if (!briefingText) return;
    navigator.clipboard.writeText(briefingText);
    setCopied(true);
    toast.success("Briefing copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const parseBriefing = (text) => {
    const sections = {
      snapshot: "",
      conditions: "",
      visits: "",
      flags: ""
    };

    if (!text) return sections;

    const snapshotIndex = text.indexOf("PATIENT SNAPSHOT");
    const conditionsIndex = text.indexOf("ACTIVE CONDITIONS");
    const visitsIndex = text.indexOf("RECENT VISITS");
    const flagsIndex = text.indexOf("RED FLAGS");

    const extractText = (startIdx, endIdx) => {
      if (startIdx === -1) return "";
      const textSlice = endIdx !== -1 
        ? text.substring(startIdx, endIdx) 
        : text.substring(startIdx);
      
      return textSlice
        .replace(/^(PATIENT SNAPSHOT|ACTIVE CONDITIONS|RECENT VISITS|RED FLAGS)[:\-\s]*/i, "")
        .trim();
    };

    sections.snapshot = extractText(snapshotIndex, conditionsIndex);
    sections.conditions = extractText(conditionsIndex, visitsIndex);
    sections.visits = extractText(visitsIndex, flagsIndex);
    sections.flags = extractText(flagsIndex, -1);

    return sections;
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        <div className="flex items-center justify-center p-4 bg-sky-500/5 border border-sky-100 dark:border-sky-900 rounded-2xl gap-2">
          <Loader2 className="h-4 w-4 text-sky-500 animate-spin" />
          <span className="text-xs text-muted-foreground font-medium animate-pulse">Groq AI is assembling pre-consultation briefings...</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border/60 bg-card p-4 space-y-3 shadow-xs">
              <div className="h-4 w-1/3 bg-muted rounded-md animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-5/6 bg-muted rounded animate-pulse" />
                <div className="h-3 w-4/6 bg-muted rounded animate-pulse" />
                <div className="h-3 w-3/6 bg-muted rounded animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !briefingText) {
    return (
      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900 text-amber-800 dark:text-amber-300 rounded-2xl flex items-center gap-2.5 text-xs font-semibold">
        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
        <p>{error || "No patient record telemetry available to compile an AI clinical briefing."}</p>
      </div>
    );
  }

  const sections = parseBriefing(briefingText);

  const formatList = (str) => {
    if (!str) return <p className="text-xs text-muted-foreground italic">None reported.</p>;
    return (
      <ul className="list-disc pl-4 space-y-1 text-xs text-foreground/90 font-medium leading-relaxed">
        {str.split("\n").map((line, idx) => {
          const cleaned = line.replace(/^[\s\-*\u2022]*/, "").trim();
          if (!cleaned) return null;
          return <li key={idx}>{cleaned}</li>;
        })}
      </ul>
    );
  };

  return (
    <div className="space-y-4 animate-in zoom-in-95 duration-300">
      
      {/* Visual Header & Actions */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-black tracking-widest text-sky-500 bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 rounded-full border border-sky-100 dark:border-sky-900/30">
          AI Decision Support
        </span>
        
        <Button 
          onClick={handleCopy}
          size="sm" 
          variant="outline"
          className="rounded-xl border-slate-200 dark:border-slate-800 h-8 gap-1.5 font-bold text-xs cursor-pointer shadow-xs"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
          Copy Briefing
        </Button>
      </div>

      {/* Grid of 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: Patient Snapshot (Blue) */}
        <Card className="border-sky-100 dark:border-sky-900/60 shadow-sm bg-gradient-to-br from-card to-sky-500/5 overflow-hidden">
          <CardHeader className="pb-2 py-3.5 border-b border-sky-100/50 flex flex-row items-center gap-2">
            <div className="p-1.5 bg-sky-100 dark:bg-sky-950 rounded-lg text-sky-600 dark:text-sky-400">
              <User className="h-4 w-4" />
            </div>
            <CardTitle className="text-xs font-black uppercase tracking-wider text-sky-700 dark:text-sky-400">
              Patient Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3.5">
            {formatList(sections.snapshot)}
          </CardContent>
        </Card>

        {/* Card 2: Active Conditions (Amber) */}
        <Card className="border-amber-100 dark:border-amber-900/60 shadow-sm bg-gradient-to-br from-card to-amber-500/5 overflow-hidden">
          <CardHeader className="pb-2 py-3.5 border-b border-amber-100/50 flex flex-row items-center gap-2">
            <div className="p-1.5 bg-amber-100 dark:bg-amber-950 rounded-lg text-amber-600 dark:text-amber-400">
              <Activity className="h-4 w-4" />
            </div>
            <CardTitle className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Active Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3.5">
            {formatList(sections.conditions)}
          </CardContent>
        </Card>

        {/* Card 3: Recent Visits (Green) */}
        <Card className="border-emerald-100 dark:border-emerald-900/60 shadow-sm bg-gradient-to-br from-card to-emerald-500/5 overflow-hidden">
          <CardHeader className="pb-2 py-3.5 border-b border-emerald-100/50 flex flex-row items-center gap-2">
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Calendar className="h-4 w-4" />
            </div>
            <CardTitle className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Recent Visits
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3.5">
            {formatList(sections.visits)}
          </CardContent>
        </Card>

        {/* Card 4: Red Flags (Red) */}
        <Card className={`shadow-sm bg-gradient-to-br from-card to-red-500/5 overflow-hidden ${
          sections.flags && sections.flags.toLowerCase().includes("none") 
            ? "border-red-100 dark:border-red-900/40" 
            : "border-red-400 dark:border-red-800 shadow-md ring-1 ring-red-400/20"
        }`}>
          <CardHeader className="pb-2 py-3.5 border-b border-red-100/50 flex flex-row items-center gap-2">
            <div className="p-1.5 bg-red-100 dark:bg-red-950 rounded-lg text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <CardTitle className="text-xs font-black uppercase tracking-wider text-red-700 dark:text-red-400">
              Red Flags
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3.5">
            {formatList(sections.flags)}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
