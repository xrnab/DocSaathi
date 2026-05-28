"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const stats = [
  {
    value: "45+",
    label: "Villages",
    description: "Digital access to hubs",
    theme: "bg-sky-500/5 border-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  {
    value: "12+",
    label: "Doctors",
    description: "Nabha specialists ready",
    theme: "bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    value: "42km",
    label: "Hospital",
    description: "Saving hours in triaging",
    theme: "bg-amber-500/5 border-amber-500/10 text-amber-600 dark:text-amber-400",
  }
];

export function ImpactStatistics() {
  return (
    <div className="w-full mt-6 sm:mt-8 px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Mobile: Horizontal Scroll with Pop-up effect | Desktop: Standard Grid */}
        <div className="flex flex-row md:grid md:grid-cols-3 gap-6 sm:gap-10 md:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar pb-10 pt-6 md:py-0 px-10 md:px-0 -mx-10 md:mx-0">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              // Reset scale for desktop, use focal scale for mobile
              initial={{ scale: 0.9, opacity: 0.8 }}
              whileInView={{ 
                scale: 1, // On desktop, this is the default
                opacity: 1,
                transition: { duration: 0.4 } 
              }}
              // Focal pop-up effect for mobile scroll
              whileHover={{ scale: 1.02 }}
              viewport={{ once: false, amount: 0.8 }}
              className={cn(
                "relative flex flex-col items-center justify-center p-5 rounded-[2.5rem] border backdrop-blur-md shrink-0 snap-center transition-all duration-300",
                "w-44 h-44 sm:w-52 sm:h-52 md:w-auto md:h-auto md:aspect-auto md:items-start md:text-left text-center",
                "aspect-square md:rounded-2xl",
                // focal effect classes that apply only when in view (handled by motion)
                "md:opacity-100 md:scale-100 shadow-xl md:shadow-none",
                stat.theme
              )}
              style={{
                // Custom mobile-only scaling using framer-motion's scroll detection is handled via whileInView
              }}
              // Specific overrides to make the "pop-up" effect work based on scroll position
              onViewportEnter={() => {}} 
            >
              <div className="space-y-2 flex flex-col items-center md:items-start">
                <div className="flex items-center gap-3">
                  {/* Indicator Line - Clean inline placement prevents overlap glitches on all viewports */}
                  <div 
                    className="w-1 h-8 rounded-full opacity-40 shrink-0" 
                    style={{ backgroundColor: "currentColor" }} 
                  />
                  <div className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-none">
                    {stat.value}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] sm:text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest leading-tight">
                    {stat.label}
                  </p>
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-500 leading-tight font-medium max-w-[140px] md:max-w-none">
                    {stat.description}
                  </p>
                </div>
              </div>

              {/* Decorative background element */}
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-current opacity-[0.05] rounded-tl-[3rem] pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Responsive scaling logic for mobile Focal Effect */
        @media (max-width: 767px) {
          .snap-center {
            transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
        }
      `}</style>
    </div>
  );
}
