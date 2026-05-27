"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Users, MapPin, Activity, Flame, ShieldAlert } from "lucide-react";

export function NabhaImpact({ stats }) {
  const {
    activeVillageUsers = 284,
    totalConsultations = 142,
    villagesCount = 7,
    villagesList = [],
    topSymptoms = [],
  } = stats || {};

  return (
    <div className="space-y-6">
      {/* Top Banner Warning/Info */}
      <Card className="border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 via-emerald-600/[0.02] to-emerald-500/5 backdrop-blur-xl rounded-3xl p-5">
        <div className="flex gap-4 items-start">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-base leading-none mb-1.5 flex items-center gap-1.5">
              Live Nabha District Epidemiological Feed
              <span className="inline-flex w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </h4>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
              This panel aggregates real-time symptom analysis queries, telemedicine consultation metrics, and local patient registrations to deliver active regional disease surveillance for the Nabha Block.
            </p>
          </div>
        </div>
      </Card>

      {/* Grid of Core Impact Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-emerald-500/20 shadow-md">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Total Consultations
                </p>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {totalConsultations}
                </div>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Telemedicine sessions & local clinic consults
                </p>
              </div>
              <div className="bg-emerald-500/10 p-3 rounded-2xl">
                <Stethoscope className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 shadow-md">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Active Village Users
                </p>
                <div className="text-3xl font-black text-amber-600 dark:text-amber-500">
                  {activeVillageUsers}
                </div>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Farming family members with complete profiles
                </p>
              </div>
              <div className="bg-amber-500/10 p-3 rounded-2xl">
                <Users className="h-6 w-6 text-amber-600 dark:text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-sky-500/20 shadow-md">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Tracked Village Hubs
                </p>
                <div className="text-3xl font-black text-sky-600 dark:text-sky-400">
                  {villagesCount}
                </div>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Empanelled rural communities around Nabha
                </p>
              </div>
              <div className="bg-sky-500/10 p-3 rounded-2xl">
                <MapPin className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts & Lists Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Top Symptoms Bar Chart */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-red-500" /> Top Reported Symptoms
            </CardTitle>
            <CardDescription className="text-xs">
              Frequent conditions detected by the local symptom checker
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {topSymptoms.map((symptom, index) => {
              // Custom color coding based on severity
              let color = "bg-sky-500";
              if (symptom.name.includes("Stubble")) color = "bg-amber-500";
              if (symptom.name.includes("Pesticide")) color = "bg-red-500";
              if (symptom.name.includes("Fever")) color = "bg-emerald-500";

              return (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      {index + 1}. {symptom.name}
                    </span>
                    <span>{symptom.count} cases ({symptom.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all duration-1000`}
                      style={{ width: `${symptom.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Column 2: Empanelled Active Villages */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-emerald-500" /> Active Nabha Communities
            </CardTitle>
            <CardDescription className="text-xs">
              Registered patient locations in the database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
              Patient registrations are actively flowing from these agriculture and rural communities. Telemedicine credits have been distributed to these hubs:
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {villagesList.map((village, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-extrabold px-3.5 py-1.5 rounded-xl text-xs hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all cursor-default"
                >
                  📍 {village}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
