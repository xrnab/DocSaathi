"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const ALL_SYMPTOMS = [
  { id: "fever", label: "Fever", icon: "🌡️" },
  { id: "headache", label: "Headache", icon: "🤕" },
  { id: "cough", label: "Cough", icon: "😷" },
  { id: "vomiting", label: "Vomiting", icon: "🤢" },
  { id: "diarrhea", label: "Diarrhea", icon: "💩" },
  { id: "chest_pain", label: "Chest Pain", icon: "💔" },
  { id: "stomach_pain", label: "Stomach Pain", icon: "🤰" },
  { id: "dizziness", label: "Dizziness", icon: "😵" },
  { id: "fatigue", label: "Fatigue", icon: "😴" },
  { id: "sore_throat", label: "Sore Throat", icon: "🗣️" },
  { id: "rash", label: "Rash", icon: "🔴" },
  { id: "joint_pain", label: "Joint Pain", icon: "🦵" },
  { id: "breathlessness", label: "Breathlessness", icon: "😮💨" },
  { id: "nausea", label: "Nausea", icon: "🤮" },
  { id: "back_pain", label: "Back Pain", icon: "🔙" },
];

export function SymptomGrid({ onChange, initialSelected = [] }) {
  const [selected, setSelected] = useState(initialSelected);

  const toggleSymptom = (id) => {
    const newSelected = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    
    setSelected(newSelected);
    if (onChange) {
      // Map IDs back to labels for the AI to understand easily
      const selectedLabels = ALL_SYMPTOMS
        .filter(s => newSelected.includes(s.id))
        .map(s => s.label);
      onChange(selectedLabels);
    }
  };

  // Sync with initialSelected if it changes from parent
  useEffect(() => {
    setSelected(initialSelected);
  }, [initialSelected]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 w-full">
      {ALL_SYMPTOMS.map((symptom) => {
        const isSelected = selected.includes(symptom.id);
        return (
          <button
            key={symptom.id}
            type="button"
            onClick={() => toggleSymptom(symptom.id)}
            className={cn(
              "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 group",
              isSelected
                ? "bg-sky-600 border-sky-600 text-white shadow-md scale-[0.98]"
                : "bg-white border-sky-50 hover:border-sky-300 text-slate-600"
            )}
          >
            <span className="text-xl sm:text-2xl mb-2 group-hover:scale-110 transition-transform">
              {symptom.icon}
            </span>
            <span className={cn(
              "text-[10px] sm:text-xs font-bold text-center leading-normal uppercase tracking-wide py-0.5 min-h-[2.4em] flex items-center justify-center",
              isSelected ? "text-sky-50" : "text-slate-500"
            )}>
              {symptom.label}
            </span>
            
            {isSelected && (
              <div className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow-sm animate-in zoom-in duration-200">
                <Check className="h-3 w-3 text-sky-600 font-bold" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
