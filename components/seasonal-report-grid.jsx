"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SeasonalReportGrid({ seasonalDiseases }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full relative overflow-hidden">
        <div className="flex flex-row md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 overflow-x-auto md:overflow-visible no-scrollbar pb-10 pt-4 md:py-0 px-10 md:px-0 -mx-10 md:mx-0">
          {seasonalDiseases.map((disease) => (
            <div key={disease.id} className="shrink-0 transition-all duration-300 h-full">
              <Card className={cn(
                "bg-card/30 backdrop-blur-xl border-2 border-sky-500/20 rounded-[2.5rem] md:rounded-[2rem] overflow-hidden h-full flex flex-col justify-center",
                "w-72 h-72 sm:w-80 sm:h-80 md:w-auto md:h-auto aspect-square md:aspect-auto"
              )}>
                <CardHeader className="pb-1 pt-4">
                  <div className="flex justify-between items-center gap-2 mb-2">
                    <Badge variant="outline" className={cn(disease.statusColor, "font-black uppercase text-[8px] tracking-tighter py-0.5 px-2 rounded-full border shadow-sm")}>
                      {disease.riskLevel}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full whitespace-nowrap">Monthly Update</span>
                  </div>
                  <CardTitle className="text-lg sm:text-xl md:text-2xl font-black text-foreground text-center md:text-left leading-tight px-2">
                    {disease.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-1 text-center md:text-left">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Key Symptoms</p>
                    <div className="flex flex-wrap gap-1 justify-center md:justify-start">
                      {disease.symptoms.slice(0, 3).map((symptom, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-xl text-slate-600 dark:text-slate-400 font-semibold border border-slate-200 dark:border-slate-800">
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Prevention Plan</p>
                    <p className="text-[10px] md:text-sm text-slate-600 dark:text-slate-400 leading-tight font-medium line-clamp-2 md:line-clamp-none px-1">
                      {disease.prevention}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative overflow-hidden">
      {/* Mobile: Horizontal Scroll with Pop-up effect | Desktop: Standard Grid */}
      <div className="flex flex-row md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar pb-10 pt-4 md:py-0 px-10 md:px-0 -mx-10 md:mx-0">
        {seasonalDiseases.map((disease, index) => (
          <motion.div 
            key={disease.id} 
            initial={{ scale: 0.9, opacity: 0.8 }}
            whileInView={{ 
              scale: 1, 
              opacity: 1, 
              transition: { duration: 0.4 } 
            }}
            viewport={{ 
              once: false, 
              amount: 0.8
            }}
            className="shrink-0 snap-center transition-all duration-300 h-full"
          >
            <Card className={cn(
              "bg-card/30 backdrop-blur-xl border-2 border-sky-500/20 hover:border-sky-500/40 transition-all duration-300 rounded-[2.5rem] md:rounded-[2rem] overflow-hidden group hover:shadow-xl hover:shadow-sky-500/5 h-full flex flex-col justify-center",
              "w-72 h-72 sm:w-80 sm:h-80 md:w-auto md:h-auto aspect-square md:aspect-auto",
              index === 1 ? "border-current/30 shadow-2xl shadow-current/10" : "opacity-80"
            )}>
              <CardHeader className="pb-1 pt-4">
                <div className="flex justify-between items-center gap-2 mb-2">
                  <Badge variant="outline" className={cn(disease.statusColor, "font-black uppercase text-[8px] tracking-tighter py-0.5 px-2 rounded-full border shadow-sm")}>
                    {disease.riskLevel}
                  </Badge>
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full whitespace-nowrap">Monthly Update</span>
                </div>
                <CardTitle className="text-lg sm:text-xl md:text-2xl font-black text-foreground group-hover:text-sky-500 transition-colors text-center md:text-left leading-tight px-2">
                  {disease.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-1 text-center md:text-left">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Key Symptoms</p>
                  <div className="flex flex-wrap gap-1 justify-center md:justify-start">
                    {disease.symptoms.slice(0, 3).map((symptom, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-xl text-slate-600 dark:text-slate-400 font-semibold border border-slate-200 dark:border-slate-800">
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Prevention Plan</p>
                  <p className="text-[10px] md:text-sm text-slate-600 dark:text-slate-400 leading-tight font-medium line-clamp-2 md:line-clamp-none px-1">
                    {disease.prevention}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
