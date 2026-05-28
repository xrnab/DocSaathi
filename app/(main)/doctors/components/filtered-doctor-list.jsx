"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { DoctorCard } from "./doctor-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function FilteredDoctorList({ initialDoctors, specialty }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  const [selectedLanguage, setSelectedLanguage] = useState(searchParams.get("lang") || "all");
  const [selectedGender, setSelectedGender] = useState(searchParams.get("gender") || "all");
  const [selectedExperience, setSelectedExperience] = useState(searchParams.get("exp") || "all");
  const [speaksPunjabi, setSpeaksPunjabi] = useState(searchParams.get("punjabi") === "true");

  // Sync state with URL params
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    
    if (selectedLanguage !== "all") params.set("lang", selectedLanguage);
    else params.delete("lang");

    if (selectedGender !== "all") params.set("gender", selectedGender);
    else params.delete("gender");

    if (selectedExperience !== "all") params.set("exp", selectedExperience);
    else params.delete("exp");

    if (speaksPunjabi) params.set("punjabi", "true");
    else params.delete("punjabi");

    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    window.history.replaceState({ ...window.history.state, as: url, url }, "", url);
  }, [selectedLanguage, selectedGender, selectedExperience, speaksPunjabi, pathname, searchParams]);

  // Filter logic
  const filteredDoctors = initialDoctors.filter((doc) => {
    // Language filter
    if (selectedLanguage !== "all") {
      const docLangs = doc.languages?.map(l => l.toLowerCase()) || [];
      if (!docLangs.includes(selectedLanguage.toLowerCase())) return false;
    }

    // Speaks Punjabi prominent quick toggle
    if (speaksPunjabi) {
      const docLangs = doc.languages?.map(l => l.toLowerCase()) || [];
      if (!docLangs.includes("punjabi")) return false;
    }

    // Gender filter
    if (selectedGender !== "all") {
      if (doc.gender?.toLowerCase() !== selectedGender.toLowerCase()) return false;
    }

    // Experience filter (dropdown)
    if (selectedExperience !== "all") {
      const exp = parseInt(doc.experience, 10) || 0;
      if (selectedExperience === "0-5" && (exp < 0 || exp > 5)) return false;
      if (selectedExperience === "5-10" && (exp < 5 || exp > 10)) return false;
      if (selectedExperience === "10+" && exp < 10) return false;
    }

    return true;
  });

  // Extract all unique languages from initialDoctors for the filter dropdown
  const languagesList = Array.from(
    new Set(initialDoctors.flatMap((doc) => doc.languages || []))
  ).map(l => l.charAt(0).toUpperCase() + l.slice(1));

  // Helper for specialty plural/label
  const specialtyLabel = specialty.split("%20").join(" ").toLowerCase();
  const getSpecialistText = (count) => {
    return `${count} ${specialtyLabel}${count === 1 ? "" : "s"}`;
  };

  return (
    <div className="space-y-6">
      {/* Sticky Filter Bar */}
      <div className="sticky top-[72px] z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-4 border-y border-slate-100 dark:border-slate-800/80 -mx-4 px-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        <div className="flex flex-wrap items-center gap-3">
          {/* Language Dropdown */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Language</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Languages</option>
              {languagesList.map(lang => (
                <option key={lang} value={lang.toLowerCase()}>{lang}</option>
              ))}
            </select>
          </div>

          {/* Gender Dropdown */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Gender</span>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Experience Dropdown */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Experience</span>
            <select
              value={selectedExperience}
              onChange={(e) => setSelectedExperience(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Experience</option>
              <option value="0-5">0 - 5 Years</option>
              <option value="5-10">5 - 10 Years</option>
              <option value="10+">10+ Years</option>
            </select>
          </div>

          {/* Speaks Punjabi Toggle */}
          <div className="flex items-end h-full pt-4">
            <button
              onClick={() => setSpeaksPunjabi(!speaksPunjabi)}
              className={cn(
                "h-9 px-4 rounded-xl text-xs font-black tracking-wider uppercase border-2 flex items-center gap-1.5 transition-all",
                speaksPunjabi
                  ? "bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-500/20"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300"
              )}
            >
              {speaksPunjabi && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              Speaks Punjabi
            </button>
          </div>
        </div>

        {/* Results Counter */}
        <div className="text-right self-end md:self-center">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none">
            Showing {filteredDoctors.length} of {getSpecialistText(initialDoctors.length)}
          </p>
        </div>
      </div>

      {/* Doctors Grid */}
      {filteredDoctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {filteredDoctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-4 bg-muted/20 rounded-2xl border border-dashed border-sky-200 dark:border-sky-900/30">
          <h3 className="text-2xl font-semibold text-foreground mb-3">
            No matching doctors found
          </h3>
          <p className="text-muted-foreground text-lg max-w-md mx-auto mb-6">
            Try adjusting your filter settings above to see more results.
          </p>
          <Button 
            onClick={() => {
              setSelectedLanguage("all");
              setSelectedGender("all");
              setSelectedExperience("all");
              setSpeaksPunjabi(false);
            }}
            className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-lg"
          >
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
}
