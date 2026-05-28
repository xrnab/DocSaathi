"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Badge } from "@/components/ui/badge";
import { nabhaHospitals } from "@/lib/nabha-hospitals";

// Fix Leaflet's default icon path issue in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom Leaflet marker icons using Tailwind SVGs
const createCustomIcon = (isEmergency) => {
  if (typeof window === "undefined") return null;
  const color = isEmergency ? "#ef4444" : "#3b82f6"; // Red for emergency, Blue for regular
  return L.divIcon({
    html: `
      <svg class="w-8 h-8 filter drop-shadow-md" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="${color}" stroke="white" stroke-width="1.5"/>
        <circle cx="12" cy="9" r="3.5" fill="white"/>
      </svg>
    `,
    className: "custom-marker-icon-wrapper",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

// Component to dynamically update map center
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function HealthMap({ userLocation, items, type = "facility" }) {
  const [lowDataMode, setLowDataMode] = useState(false);

  useEffect(() => {
    // Check localStorage first
    const saved = localStorage.getItem("low_data_mode");
    if (saved !== null) {
      setLowDataMode(saved === "true");
    } else {
      // Fallback to connection speed if 2g
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn && conn.effectiveType === "2g") {
        setLowDataMode(true);
        localStorage.setItem("low_data_mode", "true");
      }
    }
  }, []);

  const toggleLowDataMode = () => {
    const newVal = !lowDataMode;
    setLowDataMode(newVal);
    localStorage.setItem("low_data_mode", String(newVal));
  };

  // Determine if the user is in the Nabha/Patiala district area
  const isInNabhaArea = !userLocation || (
    userLocation.lat >= 30.0 && userLocation.lat <= 30.65 &&
    userLocation.lng >= 75.8 && userLocation.lng <= 76.6
  );

  // Default coordinates center Nabha (30.3731, 76.1467) when GPS is not provided
  const center = userLocation ? [userLocation.lat, userLocation.lng] : [30.3731, 76.1467];

  // Combine standard search items with preloaded verified hospitals
  const verifiedRegionalHospitals = isInNabhaArea ? nabhaHospitals.map(h => ({
    ...h,
    isVerified: true,
  })) : [];

  const combinedItems = [...verifiedRegionalHospitals, ...(items || [])];

  if (lowDataMode) {
    return (
      <div className="w-full h-full bg-slate-50 dark:bg-slate-950 p-5 flex flex-col relative overflow-y-auto font-sans">
        {/* Low Data Mode Toggle Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-0.5">
            <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Low Data Mode</h4>
            <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Map tiles hidden to save bandwidth
            </p>
          </div>
          <button 
            onClick={toggleLowDataMode}
            className="text-[9px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 transition-colors uppercase tracking-widest px-3 py-1.5 rounded-full border border-sky-100 dark:border-sky-900/50"
          >
            Show Map
          </button>
        </div>

        {combinedItems.length > 0 ? (
          <div className="space-y-3 flex-grow overflow-y-auto pr-1">
            {combinedItems.map(item => (
              <div 
                key={item.id} 
                className={`p-4 rounded-[1.5rem] border shadow-sm flex flex-col gap-2.5 hover:border-sky-200 dark:hover:border-sky-900/50 transition-all duration-300 ${
                  item.isVerified 
                    ? "bg-slate-50/50 dark:bg-slate-900/60 border-sky-500/20" 
                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      item.isVerified 
                        ? (item.emergency ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20")
                        : "bg-sky-50 dark:bg-sky-955 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-850"
                    }`}>
                      {item.type || type}
                    </Badge>
                    {item.isVerified && (
                      <Badge className="bg-sky-600 text-white font-extrabold text-[8px] tracking-wider px-2 py-0.5 rounded-full uppercase leading-none">
                        ✓ Verified
                      </Badge>
                    )}
                    {item.emergency && (
                      <Badge className="bg-red-600 text-white font-bold text-[8px] tracking-widest px-1.5 py-0.5 rounded uppercase leading-none">
                        Emergency
                      </Badge>
                    )}
                  </div>
                  
                  <h5 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">{item.name}</h5>
                  
                  {item.address && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                      📍 {item.address}
                    </p>
                  )}

                  {/* Open Status Badges (English and Punjabi) */}
                  {item.isVerified && (
                    <div className="flex flex-col gap-0.5 bg-slate-100/60 dark:bg-slate-950/40 p-2 rounded-xl border border-slate-200/40 dark:border-slate-800/40 w-fit">
                      <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                        🟢 {item.statusEn}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 pl-4.5">
                        {item.statusPb}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                    <span className="flex items-center gap-1">🚗 {item.distance || "Nearby"}</span>
                    {item.phone && (
                      <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">📞 Phone: {item.phone}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 w-full pt-1.5 border-t border-slate-100 dark:border-slate-800/40">
                  {item.phone && (
                    <a 
                      href={`tel:${item.phone}`}
                      className="bg-emerald-600 text-white text-center font-bold text-[9px] py-2.5 px-3 rounded-xl shadow-md shadow-emerald-500/10 hover:bg-emerald-700 transition-all uppercase tracking-widest no-underline flex items-center justify-center gap-1 shrink-0"
                    >
                      <span>📞</span> Call Now
                    </a>
                  )}
                  <a 
                    href={`https://www.openstreetmap.org/directions?engine=graphhopper_car&route=${userLocation?.lat || ''},${userLocation?.lng || ''};${item.lat},${item.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-sky-600 text-white text-center font-bold text-[9px] py-2.5 rounded-xl shadow-md shadow-sky-500/10 hover:bg-sky-700 transition-all uppercase tracking-widest no-underline flex-1"
                  >
                    Get Directions
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 dark:text-slate-500">
            <span className="text-2xl mb-2">📋</span>
            <p className="text-xs font-bold uppercase tracking-wider">No Items Found</p>
            <p className="text-[10px] mt-1">Locate using GPS or type a city/village to list nearby facilities.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full select-none">
      {/* Low Data Mode Toggle Switch overlay on top of the Map */}
      <div className="absolute top-3 right-3 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200/60 dark:border-slate-800 shadow-md flex items-center gap-2 select-none">
        <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Low Data</span>
        <button 
          onClick={toggleLowDataMode}
          className="w-8 h-4.5 rounded-full transition-colors relative flex items-center bg-slate-200 dark:bg-slate-800"
          style={{ width: '32px', height: '18px' }}
        >
          <span className="w-3.5 h-3.5 rounded-full bg-white shadow absolute transition-all left-0.5" />
        </button>
      </div>

      {/* Map Legend Overlay */}
      {isInNabhaArea && (
        <div className="absolute bottom-5 left-3 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-lg text-slate-850 dark:text-slate-100 text-xs space-y-2 select-none pointer-events-none">
          <h5 className="font-extrabold text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none">Verified Facilities</h5>
          <div className="space-y-1.5 font-bold">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] border border-white dark:border-slate-950 shadow-sm shrink-0"></span>
              <span>Emergency (24/7)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] border border-white dark:border-slate-950 shadow-sm shrink-0"></span>
              <span>PHC / General</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 border border-white dark:border-slate-950 shadow-sm shrink-0"></span>
              <span>GPS Location</span>
            </div>
          </div>
        </div>
      )}

      <MapContainer center={center} zoom={13} scrollWheelZoom={false} className="w-full h-full z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} />
        
        {/* User Location Marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>
              <div className="font-semibold text-sky-600 text-center">Your Location</div>
            </Popup>
          </Marker>
        )}

        {/* Regular Items Markers */}
        {items?.map(item => (
          <Marker key={item.id} position={[item.lat, item.lng]}>
            <Popup className="pharmacy-popup">
              <div className="p-1 min-w-[180px] font-sans">
                <div className="flex items-center gap-2 mb-2">
                   <Badge variant="outline" className="text-[10px] py-0.5 px-2 uppercase font-bold bg-sky-50 text-sky-600 border-sky-200 rounded-full">
                     {item.type || type}
                   </Badge>
                   {item.status && (
                     <span className="text-[10px] font-medium text-emerald-600 ml-auto">
                       {item.status}
                     </span>
                   )}
                </div>
                
                <h4 className="font-bold text-base mb-1 text-slate-900 leading-tight">
                  {item.name}
                </h4>
                
                <div className="space-y-1.5 mb-3">
                  {item.address && (
                    <p className="text-[11px] text-slate-500 flex items-start gap-1">
                      <span className="text-sky-500 mt-0.5">📍</span>
                      <span className="flex-1">{item.address}</span>
                    </p>
                  )}
                  <p className="text-[12px] font-semibold text-sky-600 flex items-center gap-1">
                    <span className="text-sky-400">🚗</span>
                    {item.distance ? `${item.distance} km away` : "Nearby"}
                  </p>
                </div>
                
                <a 
                  href={`https://www.openstreetmap.org/directions?engine=graphhopper_car&route=${userLocation?.lat || ''},${userLocation?.lng || ''};${item.lat},${item.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-sky-600 !text-white text-[11px] font-bold py-2.5 px-3 rounded-xl block w-full text-center hover:bg-sky-700 transition-all shadow-md shadow-sky-500/20 uppercase tracking-wide no-underline"
                  style={{ color: 'white' }}
                >
                  Get Directions
                </a>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Pre-loaded Verified Nabha Regional Hospitals Markers */}
        {isInNabhaArea && verifiedRegionalHospitals.map(hospital => (
          <Marker 
            key={hospital.id} 
            position={[hospital.lat, hospital.lng]}
            icon={createCustomIcon(hospital.emergency)}
          >
            <Popup className="hospital-popup">
              <div className="p-1 min-w-[200px] font-sans">
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <Badge 
                    variant="outline" 
                    className={`text-[9px] py-0.5 px-2 uppercase font-black tracking-wider rounded-full border ${
                      hospital.emergency 
                        ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800" 
                        : "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                    }`}
                  >
                    {hospital.type}
                  </Badge>
                  <Badge className="bg-sky-600 text-white font-extrabold text-[8px] tracking-wider px-2 py-0.5 rounded-full uppercase leading-none">
                    ✓ Verified
                  </Badge>
                  {hospital.emergency && (
                    <Badge className="bg-red-600 text-white font-bold text-[8px] tracking-widest px-1.5 py-0.5 rounded uppercase leading-none">
                      Emergency
                    </Badge>
                  )}
                </div>

                <h4 className="font-extrabold text-base mb-1 text-slate-900 leading-tight">
                  {hospital.name}
                </h4>

                {/* Status Badges - English and Punjabi */}
                <div className="flex flex-col gap-0.5 mb-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                  <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-1 leading-none">
                    🟢 {hospital.statusEn}
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 pl-4 leading-none">
                    {hospital.statusPb}
                  </span>
                </div>

                {/* Phone details and Call Button */}
                {hospital.phone && (
                  <div className="space-y-2 mb-3">
                    <p className="text-[11px] text-slate-600 font-semibold flex items-center gap-1">
                      📞 <span className="text-slate-400 font-medium">Phone:</span> {hospital.phone}
                    </p>
                    <a 
                      href={`tel:${hospital.phone}`}
                      className="bg-emerald-600 !text-white font-bold text-[10px] py-2 px-3 rounded-xl flex items-center justify-center gap-1 hover:bg-emerald-700 transition-all uppercase tracking-widest no-underline shadow-md shadow-emerald-500/10"
                      style={{ color: 'white' }}
                    >
                      Call Now
                    </a>
                  </div>
                )}

                {hospital.distance && (
                  <p className="text-[10px] text-slate-500 font-medium italic mb-2">
                    {hospital.distance}
                  </p>
                )}

                <a 
                  href={`https://www.openstreetmap.org/directions?engine=graphhopper_car&route=${userLocation?.lat || ''},${userLocation?.lng || ''};${hospital.lat},${hospital.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-sky-600 !text-white text-[10px] font-bold py-2 px-3 rounded-xl block w-full text-center hover:bg-sky-700 transition-all shadow-md shadow-sky-500/10 uppercase tracking-widest no-underline"
                  style={{ color: 'white' }}
                >
                  Get Directions
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
