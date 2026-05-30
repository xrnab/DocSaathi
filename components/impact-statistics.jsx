"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ImpactStatistics() {
  const [metrics, setMetrics] = useState({
    consultations: "142+",
    families: "38",
    villages: "7+"
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/live-stats");
        const data = await res.json();
        if (data.success) {
          setMetrics({
            consultations: `${data.totalAppointments}+`,
            families: `${data.totalFamilies}`,
            villages: `${data.totalVillages || data.totalOutbreakReports}+`
          });
        }
      } catch (err) {
        console.error("Error loading impact stats:", err);
      }
    }
    loadStats();
  }, []);

  const stats = [
    {
      value: metrics.villages,
      label: "Villages",
      description: "Digital access to medical hubs",
      theme: "bg-sky-500/5 border-sky-500/10 text-sky-600 dark:text-sky-400",
    },
    {
      value: metrics.consultations,
      label: "Consultations",
      description: "Completed rural tele-consults",
      theme: "bg-emerald-500/5 border-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      value: metrics.families,
      label: "Families",
      description: "Registered by Nabha ASHA Workers",
      theme: "bg-amber-500/5 border-amber-500/10 text-amber-600 dark:text-amber-400",
    }
  ];

  return (
    <div className="w-full mt-6 sm:mt-8 px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        
        {/* Dynamic Live Tracker Header */}
        <div className="flex items-center justify-between mb-6 px-10 md:px-0">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
            🏆 Real-Time Impact
            <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase px-2 py-0.5 rounded-full select-none">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              Live
            </span>
          </h3>
        </div>

        {/* Mobile: Horizontal Scroll with Pop-up effect | Desktop: Standard Grid */}
        <div className="flex flex-row md:grid md:grid-cols-3 gap-6 sm:gap-10 md:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar pb-10 pt-2 md:py-0 w-full">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0.9, opacity: 0.8 }}
              whileInView={{ 
                scale: 1, 
                opacity: 1,
                transition: { duration: 0.4 } 
              }}
              whileHover={{ scale: 1.02 }}
              viewport={{ once: false, amount: 0.8 }}
              className={cn(
                "relative flex flex-col items-center justify-center p-5 rounded-[2.5rem] border backdrop-blur-md shrink-0 snap-center transition-all duration-300",
                "w-44 h-44 sm:w-52 sm:h-52 md:w-auto md:h-auto md:aspect-auto md:items-start md:text-left text-center",
                "aspect-square md:rounded-2xl",
                "md:opacity-100 md:scale-100 shadow-xl md:shadow-none",
                stat.theme
              )}
            >
              <div className="space-y-2 flex flex-col items-center md:items-start">
                <div className="flex items-center gap-3">
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
        @media (max-width: 767px) {
          .snap-center {
            transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
        }
      `}</style>
    </div>
  );
}
