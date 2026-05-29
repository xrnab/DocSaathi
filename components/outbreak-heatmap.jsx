"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const BLOCK_COORDS = {
  "Nabha": { lat: 30.3739, lng: 76.1464 },
  "Nabha Central": { lat: 30.3750, lng: 76.1480 },
  "Sanaur": { lat: 30.2833, lng: 76.3667 },
  "Ghanaur": { lat: 30.3500, lng: 76.4000 },
  "Rajpura": { lat: 30.4833, lng: 76.6000 },
  "Samana": { lat: 30.1833, lng: 76.1833 },
  "Bhadson": { lat: 30.5050, lng: 76.1550 },
  "Sauja": { lat: 30.3450, lng: 76.1950 },
  "Kaul": { lat: 30.3600, lng: 76.1700 },
  "Chhintanwala": { lat: 30.3200, lng: 76.1300 }
};

export default function OutbreakHeatmap({ reports = [] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900/40">
        <p className="text-sm text-muted-foreground animate-pulse font-medium">Initializing Geographic Leaflet Engine...</p>
      </div>
    );
  }

  // Group reports by location (village or block) and aggregate statistics
  const groupedLocations = {};

  reports.forEach((report) => {
    // Fallback lookup: prioritize village, then block, default to Nabha
    const locationKey = BLOCK_COORDS[report.village] 
      ? report.village 
      : (BLOCK_COORDS[report.block] ? report.block : null);

    if (!locationKey) return;

    if (!groupedLocations[locationKey]) {
      groupedLocations[locationKey] = {
        name: locationKey,
        lat: BLOCK_COORDS[locationKey].lat,
        lng: BLOCK_COORDS[locationKey].lng,
        totalCases: 0,
        symptomsMap: {},
        latestReportDate: new Date(0)
      };
    }

    const entry = groupedLocations[locationKey];
    entry.totalCases += report.caseCount || 1;

    // Aggregate symptoms
    if (report.symptoms && Array.isArray(report.symptoms)) {
      report.symptoms.forEach((sym) => {
        entry.symptomsMap[sym] = (entry.symptomsMap[sym] || 0) + 1;
      });
    }

    // Track latest report
    if (report.createdAt) {
      const rDate = new Date(report.createdAt);
      if (rDate > entry.latestReportDate) {
        entry.latestReportDate = rDate;
      }
    }
  });

  const parsedLocations = Object.values(groupedLocations).map((loc) => {
    // Sort symptoms by prevalence and slice top 3
    const topSymptoms = Object.entries(loc.symptomsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([sym]) => sym);

    const formattedDate = loc.latestReportDate.getTime() > 0 
      ? loc.latestReportDate.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
      : "N/A";

    // Circle Marker styling parameters
    const radius = Math.min(8 + loc.totalCases * 2, 40);
    
    // color boundaries
    let markerColor = "#22c55e"; // green for < 6 cases
    if (loc.totalCases >= 6 && loc.totalCases <= 15) {
      markerColor = "#f59e0b"; // amber
    } else if (loc.totalCases >= 16) {
      markerColor = "#ef4444"; // red
    }

    return {
      ...loc,
      radius,
      markerColor,
      topSymptoms,
      formattedDate
    };
  });

  return (
    <div className="relative w-full h-full">
      <MapContainer 
        center={[30.3739, 76.1464]} 
        zoom={11} 
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {parsedLocations.map((loc) => (
          <CircleMarker
            key={loc.name}
            center={[loc.lat, loc.lng]}
            radius={loc.radius}
            color={loc.markerColor}
            fillColor={loc.markerColor}
            fillOpacity={0.6}
            weight={2}
          >
            <Popup className="rounded-2xl overflow-hidden font-sans">
              <div className="p-1 space-y-2 text-slate-800 dark:text-slate-200">
                <div className="border-b pb-1">
                  <h4 className="font-extrabold text-sm text-foreground">{loc.name} Village</h4>
                  <span className="text-[10px] text-muted-foreground font-semibold">Surveillance Center</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs">
                    Total Caseload: <strong className="text-foreground">{loc.totalCases} cases</strong>
                  </p>
                  {loc.topSymptoms.length > 0 && (
                    <p className="text-[11px]">
                      Top Symptoms: <span className="italic text-muted-foreground">{loc.topSymptoms.join(", ")}</span>
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 font-medium">
                    Latest Report: {loc.formattedDate}
                  </p>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Floating Legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-200 dark:border-slate-850 p-4 rounded-2xl shadow-xl z-[1000] text-xs font-semibold space-y-2.5 min-w-[150px] select-none">
        <p className="font-black text-[9px] uppercase tracking-wider text-slate-400 border-b pb-1.5 leading-none">
          Caseload Intensity
        </p>
        <div className="flex items-center gap-2 text-foreground">
          <span className="w-3 h-3 rounded-full bg-[#22c55e] inline-block shadow-sm" />
          <span>Low (1 - 5 cases)</span>
        </div>
        <div className="flex items-center gap-2 text-foreground">
          <span className="w-3 h-3 rounded-full bg-[#f59e0b] inline-block shadow-sm" />
          <span>Medium (6 - 15 cases)</span>
        </div>
        <div className="flex items-center gap-2 text-foreground">
          <span className="w-3 h-3 rounded-full bg-[#ef4444] inline-block shadow-sm" />
          <span>High (16+ cases)</span>
        </div>
      </div>
    </div>
  );
}
