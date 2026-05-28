"use client";

import { useState, useEffect } from "react";
import { 
  getOutbreakDashboardData, 
  resolveOutbreakAlert, 
  NABHA_VILLAGES, 
  SYMPTOMS_POOL 
} from "@/actions/outbreak";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  ShieldAlert, 
  Activity, 
  Users, 
  MapPin, 
  FileSpreadsheet, 
  PlusCircle, 
  CheckCircle,
  TrendingUp,
  Loader2,
  Calendar
} from "lucide-react";

export default function OutbreakSurveillancePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState({});
  const [selectedVillageFilter, setSelectedVillageFilter] = useState("ALL");
  const [selectedSymptomFilter, setSelectedSymptomFilter] = useState("ALL");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getOutbreakDashboardData();
      setData(res);
    } catch (err) {
      console.error("Failed to load epidemiology logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolve = async (village) => {
    setResolving(prev => ({ ...prev, [village]: true }));
    try {
      const res = await resolveOutbreakAlert(village);
      if (res.success) {
        alert(res.message);
        await loadData();
      }
    } catch (err) {
      console.error("Failed to resolve alert:", err);
    } finally {
      setResolving(prev => ({ ...prev, [village]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 text-rose-500 animate-spin" />
        <p className="text-muted-foreground font-semibold animate-pulse">Analyzing Epidemiological Surveillance Streams...</p>
      </div>
    );
  }

  // Filter logs
  const filteredLogs = data?.submissions.filter(sub => {
    const vMatch = selectedVillageFilter === "ALL" || sub.village === selectedVillageFilter;
    const sMatch = selectedSymptomFilter === "ALL" || sub.symptoms.includes(selectedSymptomFilter);
    return vMatch && sMatch;
  }) || [];

  // Calculate SVG line chart parameters
  const chartTimeline = data?.chartTimeline || [];
  const maxVal = Math.max(...chartTimeline.map(t => t.count), 5);
  const chartWidth = 500;
  const chartHeight = 160;

  const points = chartTimeline.map((item, index) => {
    const x = (index / (chartTimeline.length - 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - (item.count / maxVal) * (chartHeight - 40) - 20;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl animate-in fade-in duration-300">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="space-y-3">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-100 dark:border-rose-900/30">
            <ShieldAlert className="w-3.5 h-3.5 mr-1.5" /> Department of Public Health
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
            Outbreak Early-Warning Dashboard
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm md:text-base leading-relaxed">
            Real-time epidemiological monitoring system for the Nabha block. Aggregates live symptom submissions and flags village spikes exceeding 200% within 48 hours.
          </p>
        </div>

        <Button onClick={loadData} className="w-fit bg-slate-900 hover:bg-black text-white shrink-0 font-bold px-5">
          🔄 Sync Real-Time Data
        </Button>
      </div>

      {/* Critical Outbreak Spike Alerts */}
      {data?.activeAlerts && data.activeAlerts.length > 0 ? (
        <div className="space-y-4">
          {data.activeAlerts.map((alert, idx) => (
            <div 
              key={idx} 
              className={`p-6 rounded-3xl border-2 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden animate-pulse ${
                alert.severity === "CRITICAL"
                  ? "bg-rose-50 dark:bg-rose-950/20 border-rose-400 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                  : "bg-amber-50 dark:bg-amber-950/20 border-amber-400 dark:border-amber-800 text-amber-900 dark:text-amber-200"
              }`}
            >
              <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
              
              <div className="flex gap-4 items-start relative z-10">
                <div className={`p-3.5 rounded-2xl shrink-0 ${alert.severity === "CRITICAL" ? "bg-rose-500 text-white" : "bg-amber-500 text-white"}`}>
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-black uppercase tracking-wider bg-white/30 backdrop-blur-md px-2.5 py-0.5 rounded-full">
                    {alert.severity} EPIDEMIOLOGICAL SPIKE DETECTED
                  </span>
                  <h3 className="text-lg md:text-xl font-extrabold tracking-tight leading-tight">{alert.message}</h3>
                  <p className="text-xs opacity-80 leading-relaxed">
                    Symptom checker activity spiked significantly in village <strong>{alert.village}</strong>. Baseline count was {alert.prev48h} cases. Current 48h count has surged to {alert.last48h} active queries.
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex flex-wrap gap-3 items-center relative z-10">
                <Button 
                  onClick={() => handleResolve(alert.village)}
                  disabled={resolving[alert.village]}
                  className="bg-slate-900 hover:bg-black text-white font-extrabold px-5 shadow-sm"
                >
                  {resolving[alert.village] ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                  Deploy Mobile Health Camp
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-3xl flex items-center gap-4">
          <CheckCircle className="w-8 h-8 text-emerald-500 shrink-0" />
          <div>
            <h4 className="font-extrabold text-base text-emerald-950 dark:text-emerald-200">Epidemiological Levels Normal</h4>
            <p className="text-sm opacity-90">No village-level anomalies or active symptom spikes have crossed the 200% alert threshold today.</p>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="flex items-center p-6 space-x-4">
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 rounded-2xl text-rose-500 border border-rose-100 dark:border-rose-800">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Surveillance Logs</p>
              <p className="text-2xl font-black text-foreground">{data?.totalCount} Submissions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="flex items-center p-6 space-x-4">
            <div className="p-3.5 bg-sky-50 dark:bg-sky-950/40 rounded-2xl text-sky-500 border border-sky-100 dark:border-sky-800">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Villages Tracked</p>
              <p className="text-2xl font-black text-foreground">5 Local Wards</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="flex items-center p-6 space-x-4">
            <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl text-indigo-500 border border-indigo-100 dark:border-indigo-800">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">ASHA Formal Reports</p>
              <p className="text-2xl font-black text-foreground">{data?.formalReports.length} Dispatches</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="flex items-center p-6 space-x-4">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl text-amber-500 border border-amber-100 dark:border-amber-800">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Active Spikes</p>
              <p className="text-2xl font-black text-foreground">{data?.activeAlerts.length} Alerts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SVG Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Line Chart */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <TrendingUp className="text-sky-500 w-5 h-5" /> Daily Symptom Queries (7-Day Trend)
            </CardTitle>
            <CardDescription>Live telemetry tracking patient screening cycles.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <div className="w-full max-w-[500px]">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible w-full h-auto">
                {/* Horizontal grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = chartHeight - ratio * (chartHeight - 40) - 20;
                  return (
                    <g key={i}>
                      <line 
                        x1="20" 
                        y1={y} 
                        x2={chartWidth - 20} 
                        y2={y} 
                        stroke="currentColor" 
                        strokeOpacity="0.08" 
                        strokeWidth="1" 
                      />
                      <text 
                        x="10" 
                        y={y + 3} 
                        className="text-[9px] fill-muted-foreground font-black text-right"
                      >
                        {Math.round(ratio * maxVal)}
                      </text>
                    </g>
                  );
                })}
                
                {/* Connecting Line path */}
                {points && (
                  <path 
                    d={`M ${points}`} 
                    fill="none" 
                    stroke="#0284c7" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-md"
                  />
                )}

                {/* Circles for values */}
                {chartTimeline.map((item, index) => {
                  const x = (index / (chartTimeline.length - 1)) * (chartWidth - 40) + 20;
                  const y = chartHeight - (item.count / maxVal) * (chartHeight - 40) - 20;
                  return (
                    <g key={index} className="group">
                      <circle 
                        cx={x} 
                        cy={y} 
                        r="5.5" 
                        fill="#0284c7" 
                        stroke="white" 
                        strokeWidth="2.5" 
                      />
                      <text 
                        x={x} 
                        y={chartHeight - 2} 
                        textAnchor="middle" 
                        className="text-[9.5px] fill-muted-foreground font-extrabold"
                      >
                        {item.date}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <FileSpreadsheet className="text-sky-500 w-5 h-5" /> Symptom Prevalence Counts
            </CardTitle>
            <CardDescription>Most frequently recorded symptom checker diagnostics.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {Object.entries(data?.symptomCounts || {}).slice(0, 5).map(([sym, count], idx) => {
              const maxSymptomVal = Math.max(...Object.values(data?.symptomCounts || {}), 1);
              const pct = (count / maxSymptomVal) * 100;
              return (
                <div key={sym} className="space-y-1.5">
                  <div className="flex justify-between text-sm font-bold text-foreground">
                    <span>{idx + 1}. {sym}</span>
                    <span className="text-sky-500">{count} queries</span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-border/40">
                    <div 
                      className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full transition-all duration-500" 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Grid of Villages Surveillance status */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <MapPin className="text-rose-500 w-5 h-5" /> Village-Level Surveillance Matrix
          </CardTitle>
          <CardDescription>Real-time caseload monitoring across Nabha Block wards.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {Object.entries(data?.villageStats || {}).map(([village, stats]) => {
              const baseline = stats.prev48h || 1;
              const ratio = stats.last48h / baseline;
              const hasAlert = stats.last48h >= 4 && ratio >= 2.0;

              return (
                <div 
                  key={village} 
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between min-h-[140px] ${
                    hasAlert 
                      ? "bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 shadow-inner" 
                      : "bg-slate-50/50 dark:bg-slate-900/30 border-border/60"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-foreground text-base">{village}</span>
                      <span className={`w-3.5 h-3.5 rounded-full ${hasAlert ? "bg-rose-500 animate-ping" : "bg-emerald-500"}`} />
                    </div>
                    <p className="text-2xl font-black text-foreground mt-3">{stats.total} total</p>
                  </div>
                  
                  <div className="border-t border-border/60 pt-2.5 mt-3 flex justify-between items-center text-xs font-semibold text-muted-foreground">
                    <span>Last 48h: <strong>{stats.last48h}</strong></span>
                    <span>Prev: <strong>{stats.prev48h}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ASHA formal Outbreak reports logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Outbreak Reports List */}
        <div className="lg:col-span-1">
          <Card className="border-border bg-card shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                <ShieldAlert className="text-sky-500 w-5 h-5" /> ASHA Dispatched Alerts
              </CardTitle>
              <CardDescription>Official epidemic notifications dispatched by ASHA field workers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {data?.formalReports.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-4">No formal outbreak dispatches logged today.</p>
              ) : (
                data?.formalReports.map((report) => (
                  <div key={report.id} className="border border-border/80 rounded-2xl p-4 bg-slate-50/20 dark:bg-slate-900/10 space-y-2">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                      <span className="font-extrabold text-foreground text-sm">{report.reportedBy?.name || "ASHA Worker"}</span>
                      <Badge variant="destructive" className="text-[10px] font-black">{report.caseCount} cases</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold">
                      Village: <strong className="text-foreground">{report.village}</strong> • Block: {report.block}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {report.symptoms.map((s, idx) => (
                        <span key={idx} className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 text-[9px] font-bold px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                    {report.notes && (
                      <p className="text-[11px] text-muted-foreground italic leading-relaxed mt-2 pt-2 border-t border-border/40">
                        &quot;{report.notes}&quot;
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Surveillance Logs */}
        <div className="lg:col-span-2">
          <Card className="border-border bg-card shadow-sm h-full">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                  <FileSpreadsheet className="text-sky-500 w-5 h-5" /> Surveillance Logs Registry
                </CardTitle>
                <CardDescription>Exhaustive list of automated symptom checker telemetry reports.</CardDescription>
              </div>
              
              {/* Simple filter drop-downs */}
              <div className="flex gap-2 shrink-0">
                <Select onValueChange={v => setSelectedVillageFilter(v)} value={selectedVillageFilter}>
                  <SelectTrigger className="w-[120px] bg-slate-50/50 dark:bg-slate-900/30 text-xs">
                    <SelectValue placeholder="Village" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Villages</SelectItem>
                    {NABHA_VILLAGES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select onValueChange={v => setSelectedSymptomFilter(v)} value={selectedSymptomFilter}>
                  <SelectTrigger className="w-[120px] bg-slate-50/50 dark:bg-slate-900/30 text-xs">
                    <SelectValue placeholder="Symptom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Symptoms</SelectItem>
                    {SYMPTOMS_POOL.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[350px] overflow-y-auto pr-1">
                <table className="w-full text-left text-xs font-semibold text-muted-foreground border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-950/80 sticky top-0 border-b border-border/80 text-foreground font-black text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Village</th>
                      <th className="p-4">Symptoms</th>
                      <th className="p-4">Demographics</th>
                      <th className="p-4">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredLogs.slice(0, 15).map((log, idx) => (
                      <tr key={log.id || idx} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 whitespace-nowrap text-foreground font-extrabold flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          {new Date(log.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                          <span className="text-[10px] font-normal text-muted-foreground ml-1">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap text-foreground font-bold">{log.village || "Nabha Central"}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {log.symptoms.map((s, sIdx) => (
                              <span key={sIdx} className="bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/30 text-[9px] font-bold px-2 py-0.5 rounded-full">{s}</span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap uppercase tracking-wider text-[9px] font-black">
                          <Badge variant="outline" className="text-[9px] font-black border-border/80">{log.patientType}</Badge>
                        </td>
                        <td className="p-4 whitespace-nowrap text-muted-foreground/80">{log.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
