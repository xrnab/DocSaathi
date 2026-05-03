"use client";

import { useEffect } from "react";
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
  // Default to a generic location if not provided
  const center = userLocation ? [userLocation.lat, userLocation.lng] : [20.5937, 78.9629];

  return (
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
  );
}
