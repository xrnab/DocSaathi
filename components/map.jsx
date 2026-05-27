"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Badge } from "@/components/ui/badge";

// Fix Leaflet's default icon path issue in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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

  // Default to a generic location if not provided
  const center = userLocation ? [userLocation.lat, userLocation.lng] : [20.5937, 78.9629];

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

        {items && items.length > 0 ? (
          <div className="space-y-3 flex-1">
            {items.map(item => (
              <div 
                key={item.id} 
                className="p-4 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-2.5 hover:border-sky-200 dark:hover:border-sky-900/50 transition-all duration-300"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-955 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-850">
                      {item.type || type}
                    </Badge>
                    {item.status && (
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                        {item.status}
                      </span>
                    )}
                  </div>
                  <h5 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{item.name}</h5>
                  {item.address && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                      📍 {item.address}
                    </p>
                  )}
                  <p className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                    <span>🚗</span> {item.distance ? `${item.distance} km away` : "Nearby"}
                  </p>
                </div>
                <a 
                  href={`https://www.openstreetmap.org/directions?engine=graphhopper_car&route=${userLocation?.lat || ''},${userLocation?.lng || ''};${item.lat},${item.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-sky-600 text-white text-center font-bold text-[10px] py-2 rounded-xl shadow-md shadow-sky-500/10 hover:bg-sky-700 transition-all uppercase tracking-widest no-underline"
                >
                  Get Directions
                </a>
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
    <div className="relative w-full h-full">
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

        {/* Markers */}
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
      </MapContainer>
    </div>
  );
}
