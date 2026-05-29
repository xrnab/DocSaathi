"use client";

import { useState, useEffect } from "react";
import { MapPin, ArrowRight, User, Star, Loader2, Hospital, Navigation, Map as MapIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getNearbyHealthFacilities } from "@/actions/nearby";
import dynamic from "next/dynamic";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const HealthMap = dynamic(() => import("@/components/map"), { ssr: false });

const MOCK_NEARBY_DOCTORS = [
  { id: 1, name: "Dr. Sarah Chen", specialty: "Cardiologist", distance: "0.8 km", rating: 4.9 },
  { id: 2, name: "Dr. James Wilson", specialty: "Dermatologist", distance: "1.2 km", rating: 4.8 },
  { id: 3, name: "Dr. Elena Rodriguez", specialty: "Pediatrician", distance: "2.5 km", rating: 4.7 },
];

export default function NearbyDoctors({ className }) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [showList, setShowList] = useState(false);
  const [location, setLocation] = useState(null);
  const [coords, setCoords] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [type, setType] = useState("doctors");

  const handleDetectLocation = () => {
    setIsDetecting(true);
    
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const userCoords = { lat: latitude, lng: longitude };
        setCoords(userCoords);
        
        try {
          // 1. Get readable location
          const geoResp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const geoData = await geoResp.json();
          const city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.suburb || "Nearby Area";
          setLocation(city);

          // 2. Fetch real nearby facilities
          const { facilities: realFacilities, error } = await getNearbyHealthFacilities(latitude, longitude, 5, type);
          if (error) throw new Error(error);
          setFacilities(realFacilities || []);
        } catch (e) {
          console.error(e);
          setLocation("Your Location");
        }
        
        setIsDetecting(false);
        setShowList(true);
      },
      async (error) => {
        console.warn("Geolocation failed/denied. Falling back to Nabha coords:", error);
        const fallbackLat = 30.3762;
        const fallbackLng = 76.1427;
        const userCoords = { lat: fallbackLat, lng: fallbackLng };
        setCoords(userCoords);
        setLocation("Nabha");
        
        try {
          const { facilities: realFacilities, error: fetchErr } = await getNearbyHealthFacilities(fallbackLat, fallbackLng, 5, type);
          if (fetchErr) throw new Error(fetchErr);
          setFacilities(realFacilities || []);
        } catch (e) {
          console.error(e);
        }
        setIsDetecting(false);
        setShowList(true);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    handleDetectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn("relative sm:absolute sm:bottom-6 sm:left-6 w-full sm:w-[280px] max-w-sm sm:max-w-none animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 z-30", className)}>
      <div className={cn(
        "bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-sky-500/20 shadow-2xl transition-all duration-500 overflow-hidden",
        showList ? "p-0" : "p-3 sm:p-4"
      )}>
        {!showList ? (
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-600/10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                   <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">Nearby Support</p>
                   <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-0 text-[8px] sm:text-[9px] h-3.5 sm:h-4 py-0 px-1 font-bold">GPS ACTIVE</Badge>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">Real-time finder</p>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={handleDetectLocation}
              disabled={isDetecting}
              className="rounded-lg sm:rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-500/20 px-3 sm:px-4 h-9 sm:h-10"
            >
              {isDetecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* Nabha District Doctors Banner */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between text-[10px] sm:text-[11px] font-bold shadow-inner">
              <span className="flex items-center gap-1 sm:gap-1.5">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white animate-pulse"></span>
                Local Doctors Active
              </span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link href="/doctors" className="bg-white/20 hover:bg-white/30 text-white rounded-lg px-2 sm:px-2.5 py-1 text-[8px] sm:text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-0.5">
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
                <button 
                  onClick={() => setShowList(false)}
                  className="p-1 rounded-lg hover:bg-white/20 text-white transition-all focus:outline-none shrink-0"
                  aria-label="Close panel"
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-sky-50/30 dark:bg-sky-900/10 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest">Scanning</p>
                <p className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1 truncate">
                  <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-sky-500" /> {location}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                 <Button 
                  variant={type === "doctors" ? "default" : "ghost"} 
                  size="sm" 
                  className="h-6 sm:h-7 text-[9px] sm:text-[10px] rounded-lg px-1.5 sm:px-2"
                  onClick={() => { setType("doctors"); handleDetectLocation(); }}
                >
                  Docs
                </Button>
                <Button 
                  variant={type === "hospitals" ? "default" : "ghost"} 
                  size="sm" 
                  className="h-6 sm:h-7 text-[9px] sm:text-[10px] rounded-lg px-1.5 sm:px-2"
                  onClick={() => { setType("hospitals"); handleDetectLocation(); }}
                >
                  Hosps
                </Button>
              </div>
            </div>
            
            <div className="max-h-[180px] sm:max-h-[220px] overflow-y-auto scrollbar-hide">
              {facilities.length > 0 ? facilities.map((fac) => (
                <div 
                  key={fac.id} 
                  className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group"
                >
                  <div className={cn(
                    "w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 border shadow-sm",
                    fac.type === "hospital" 
                      ? "bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/30" 
                      : "bg-sky-50 dark:bg-sky-950/30 border-sky-100 dark:border-sky-900/30"
                  )}>
                    {fac.type === "hospital" ? (
                      <Hospital className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600 dark:text-rose-400" />
                    ) : (
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600 dark:text-sky-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 sm:gap-2">
                      <p className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate">{fac.name}</p>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold whitespace-nowrap">{fac.distance}km</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[8px] sm:text-[9px] py-0 px-1 sm:px-1.5 h-3.5 sm:h-4 font-bold border-0",
                          fac.type === "hospital" 
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300" 
                            : "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300"
                        )}
                      >
                        {fac.type === "hospital" ? "HOSP" : "CLINIC"}
                      </Badge>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate italic">{fac.specialty}</p>
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${fac.lat},${fac.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto flex items-center gap-1 text-[9px] sm:text-[10px] text-sky-600 dark:text-sky-400 font-bold hover:bg-sky-50 dark:hover:bg-sky-900/40 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg transition-colors border border-sky-100/50 dark:border-sky-900/30"
                      >
                        <Navigation className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> GO
                      </a>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-6 sm:p-8 text-center">
                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-sky-400 mx-auto mb-2" />
                  <p className="text-[10px] sm:text-[11px] text-slate-500">Searching...</p>
                </div>
              )}
            </div>
            
            <div className="p-2 sm:p-3 grid grid-cols-2 gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full h-8 sm:h-9 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold border-sky-500/20 hover:bg-sky-50 dark:hover:bg-sky-900/30">
                    <MapIcon className="h-3 w-3 mr-1 sm:mr-1.5" /> Map View
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-full sm:max-w-4xl h-[90vh] sm:h-[80vh] p-0 overflow-hidden border-0 bg-white dark:bg-slate-950">
                   <DialogHeader className="p-3 sm:p-4 border-b absolute top-0 left-0 right-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
                      <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                         <MapIcon className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600" /> Nearby {type}
                      </DialogTitle>
                   </DialogHeader>
                   <div className="w-full h-full pt-14 sm:pt-16">
                      <HealthMap userLocation={coords} items={facilities} type={type === "hospitals" ? "Hospital" : "Clinic"} />
                   </div>
                </DialogContent>
              </Dialog>

              <Button asChild variant="default" size="sm" className="w-full h-8 sm:h-9 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold bg-sky-600 hover:bg-sky-700">
                <Link href="/doctors">All Doctors</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
