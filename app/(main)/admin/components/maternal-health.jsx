"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { Heart, Search, Calendar, User, Activity, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";

export function MaternalHealth({ pregnancies, stats }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL"); // ALL, HIGH, NORMAL

  const filteredPregnancies = pregnancies.filter((p) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      p.patient?.name?.toLowerCase().includes(query) ||
      p.patient?.village?.toLowerCase().includes(query) ||
      p.asha?.name?.toLowerCase().includes(query);

    if (riskFilter === "HIGH") return matchesSearch && p.isHighRisk;
    if (riskFilter === "NORMAL") return matchesSearch && !p.isHighRisk;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Active Registries", count: stats.activeCases, color: "pink", icon: Heart, desc: "Total active community pregnancies" },
          { title: "High-Risk Cases", count: stats.highRiskCases, color: "rose", icon: ShieldAlert, desc: "Cases with active health risk flags" },
          { title: "Due in 30 Days", count: stats.dueSoonCount, color: "amber", icon: Calendar, desc: "Approaching deliveries" },
          { title: "Zero ANC Logged", count: stats.zeroAncCount, color: "orange", icon: AlertTriangle, desc: "Mothers without baseline checkups" }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className={`bg-card border border-border rounded-2xl p-5 border-l-4 border-l-${card.color}-500 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden`}
            >
              <Icon className={`absolute top-4 right-4 h-5 w-5 text-${card.color}-500 opacity-80`} />
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider leading-none">{card.title}</span>
                <p className="text-3xl font-black text-foreground mt-2">{card.count}</p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-normal font-medium">{card.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Directory Card */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500 fill-pink-500/20" />
                Maternal Health Registry Directory
              </CardTitle>
              <CardDescription>
                Overview of community cases, critical alerts, and antenatal care schedules.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
              {/* Risk Status Filter */}
              <div className="flex bg-muted/50 p-1 rounded-xl border border-border gap-1 w-full sm:w-auto">
                {["ALL", "HIGH", "NORMAL"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setRiskFilter(filter)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer capitalize ${
                      riskFilter === filter
                        ? "bg-white dark:bg-slate-950 text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {filter === "ALL" ? "All Cases" : filter === "HIGH" ? "High Risk" : "Normal"}
                  </button>
                ))}
              </div>
              
              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search case, village, ASHA..."
                  className="pl-9 bg-background border-border focus-visible:ring-pink-500 rounded-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/30 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-bold">Patient & Village</th>
                  <th className="px-6 py-4 font-bold">ASHA Worker</th>
                  <th className="px-6 py-4 font-bold">Gestational Progress</th>
                  <th className="px-6 py-4 font-bold">Latest ANC Vitals</th>
                  <th className="px-6 py-4 font-bold">Est. Due Date (EDD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPregnancies.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center text-muted-foreground font-medium">
                      {searchTerm || riskFilter !== "ALL" ? "No pregnancy records match your filters." : "No active pregnancy cases found."}
                    </td>
                  </tr>
                ) : (
                  filteredPregnancies.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      {/* Patient Details */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-foreground text-sm">{p.patient.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${
                              p.isHighRisk
                                ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-400"
                                : "bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-950/40 dark:border-pink-900 dark:text-pink-400"
                            }`}>
                              {p.isHighRisk ? "High Risk" : "Normal"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">Village: <strong className="text-foreground">{p.patient.village || "Nabha"}</strong> • Age: {p.patient.age || "—"} Years</p>
                          {p.isHighRisk && p.riskFactors?.length > 0 && (
                            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50/50 dark:bg-rose-950/20 px-2 py-1 rounded-md border border-rose-100 dark:border-rose-900/30 w-fit max-w-[220px]">
                              Factors: {p.riskFactors.join(", ")}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* ASHA Worker */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-foreground">{p.asha?.name || "Unassigned"}</span>
                        </div>
                      </td>

                      {/* Gestational Progress */}
                      <td className="px-6 py-4">
                        <div className="space-y-1.5 max-w-[160px]">
                          <div className="flex justify-between text-xs font-bold leading-none">
                            <span>Trimester {p.trimester}</span>
                            <span className="text-pink-600 dark:text-pink-400">{p.weeksPregnant} Wks</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-pink-500 transition-all rounded-full"
                              style={{ width: `${Math.min((p.weeksPregnant / 40) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Latest ANC Vitals */}
                      <td className="px-6 py-4">
                        {p.ancVisits?.length === 0 ? (
                          <div className="flex items-center text-xs text-amber-600 dark:text-amber-500 font-bold gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>Zero ANC Visits Logged</span>
                          </div>
                        ) : (
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2 font-bold text-foreground">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                              <span>ANC #{p.ancVisits[0].visitNumber} • {format(new Date(p.ancVisits[0].visitDate), "MMM dd")}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-normal font-semibold">
                              BP: {p.bloodPressure || p.ancVisits[0].bloodPressure || "—"} | Hb: {p.hemoglobin || p.ancVisits[0].hemoglobin || "—"} g/dL
                              {p.bloodSugar && ` | Sugar: ${p.bloodSugar} mg/dL`}
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Est. Due Date (EDD) */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-bold text-foreground text-xs">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(p.edd), "MMM dd, yyyy")}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
