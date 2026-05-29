"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

export default function LiveStatsBanner() {
  const [stats, setStats] = useState(null);
  const [displayStats, setDisplayStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalFamilies: 0,
    totalOutbreakReports: 0,
    totalVaccinations: 0,
    totalSymptomChecks: 0
  });

  const animateValue = (key, target, duration = 1000) => {
    if (!target) return;
    const start = 0;
    const stepTime = 20; // 20ms
    const totalSteps = duration / stepTime;
    const increment = target / totalSteps;
    let current = start;
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      current += increment;
      if (step >= totalSteps) {
        clearInterval(timer);
        setDisplayStats(prev => ({ ...prev, [key]: target }));
      } else {
        setDisplayStats(prev => ({ ...prev, [key]: Math.round(current) }));
      }
    }, stepTime);
  };

  const fetchStats = async (isFirstMount = false) => {
    try {
      const res = await fetch("/api/live-stats");
      const data = await res.json();
      if (data.success) {
        setStats(data);
        if (isFirstMount) {
          animateValue("totalPatients", data.totalPatients);
          animateValue("totalDoctors", data.totalDoctors);
          animateValue("totalAppointments", data.totalAppointments);
          animateValue("totalFamilies", data.totalFamilies);
          animateValue("totalOutbreakReports", data.totalOutbreakReports);
          animateValue("totalVaccinations", data.totalVaccinations);
          animateValue("totalSymptomChecks", data.totalSymptomChecks);
        } else {
          setDisplayStats({
            totalPatients: data.totalPatients,
            totalDoctors: data.totalDoctors,
            totalAppointments: data.totalAppointments,
            totalFamilies: data.totalFamilies,
            totalOutbreakReports: data.totalOutbreakReports,
            totalVaccinations: data.totalVaccinations,
            totalSymptomChecks: data.totalSymptomChecks
          });
        }
      }
    } catch (error) {
      console.error("Error fetching live stats ticker:", error);
    }
  };

  useEffect(() => {
    fetchStats(true);
    const interval = setInterval(() => fetchStats(false), 30000);
    return () => clearInterval(interval);
  }, []);

  const tickerText = `🩺 ${displayStats.totalAppointments} Consultations Completed  ·  👨‍👩‍👧 ${displayStats.totalFamilies} Families Registered  ·  🦠 ${displayStats.totalOutbreakReports} Outbreak Reports Filed  ·  💉 ${displayStats.totalVaccinations} Vaccinations Tracked  ·  🔍 ${displayStats.totalSymptomChecks} Symptom Checks  ·  📊 Live Data Ticker`;

  return (
    <div className="w-full bg-emerald-600 dark:bg-emerald-700 text-white py-2 overflow-hidden border-b border-emerald-500/30 text-xs sm:text-sm font-bold relative z-50 select-none shadow-md">
      <div className="ticker-wrapper flex whitespace-nowrap">
        {/* We double the ticker content to ensure seamless infinite looping */}
        <div className="ticker-content flex shrink-0 animate-marquee gap-8 pr-8">
          <span>{tickerText}</span>
          <span>{tickerText}</span>
          <span>{tickerText}</span>
        </div>
      </div>

      <style jsx>{`
        .ticker-wrapper {
          overflow: hidden;
          width: 100%;
        }
        .ticker-content {
          animation: marquee 25s linear infinite;
        }
        .ticker-content:hover {
          animation-play-state: paused;
        }
        @keyframes marquee {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-33.3333%, 0, 0);
          }
        }
      `}</style>
    </div>
  );
}
