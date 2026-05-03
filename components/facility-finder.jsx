"use client";

import { useState, useEffect } from "react";
import { MapPin, Navigation, Loader2, Hospital, Stethoscope, Search, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function FacilityFinder() {
  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [locationName, setLocationName] = useState("");

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const findFacilities = async () => {
    setLoading(true);
    setError(null);
    setIsSearching(false);

    // Get location
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lon } = position.coords;
        localStorage.setItem("last_known_location", JSON.stringify({ lat, lon }));
        await fetchFacilities(lat, lon);
      },
      async (err) => {
        console.warn("Geolocation failed, trying cache...", err);
        const cached = localStorage.getItem("last_known_location");
        if (cached) {
          const { lat, lon } = JSON.parse(cached);
          await fetchFacilities(lat, lon);
        } else {
          setError("Could not determine your location. Please type an area name instead.");
          setLoading(false);
          setIsSearching(true);
        }
      }
    );
  };

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        await fetchFacilities(parseFloat(lat), parseFloat(lon));
      } else {
        setError("Location not found. Please try a different area name.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to search location. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilities = async (lat, lon) => {
    try {
      // Reverse geocode to get area name
      const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const geoData = await geoResponse.json();
      const area = geoData.address.suburb || geoData.address.neighbourhood || geoData.address.city || "Your Area";
      setLocationName(area);

      const query = `
        [out:json];
        (
          node["amenity"="hospital"](around:5000,${lat},${lon});
          node["amenity"="clinic"](around:5000,${lat},${lon});
          node["amenity"="doctors"](around:5000,${lat},${lon});
        );
        out body;
      `;

      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query
      });

      const data = await response.json();
      
      const processed = data.elements
        .map(el => ({
          id: el.id,
          name: el.tags.name || "Medical Facility",
          type: el.tags.amenity,
          distance: getDistance(lat, lon, el.lat, el.lon),
          lat: el.lat,
          lon: el.lon
        }))
        .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
        .slice(0, 5);

      setFacilities(processed);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch nearby facilities. Please check your internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {facilities.length === 0 ? (
        <div className="space-y-6">
          {!isSearching ? (
            <div className="space-y-6">
              <Button 
                onClick={findFacilities} 
                disabled={loading}
                className="w-full h-20 bg-sky-600 text-white hover:bg-sky-700 rounded-3xl font-bold text-xl shadow-xl shadow-sky-500/30 transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-1"
              >
                {loading ? (
                  <><Loader2 className="h-6 w-6 animate-spin" /> Scanning Location...</>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-6 w-6" /> Use My Location
                    </div>
                    <span className="text-[10px] font-normal opacity-80">Instant results based on GPS</span>
                  </>
                )}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-100 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-[0.25em] font-black">
                  <span className="bg-white dark:bg-slate-950 px-4 text-slate-400">or search manually</span>
                </div>
              </div>
              <Button 
                variant="outline"
                onClick={() => setIsSearching(true)}
                className="w-full h-14 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl font-bold text-sm shadow-sm"
              >
                <Search className="mr-2 h-4 w-4 text-sky-500" /> Search by Area Name
              </Button>
            </div>
          ) : (
            <form onSubmit={handleManualSearch} className="space-y-4 animate-in fade-in duration-300">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter city or neighborhood..."
                  className="pl-12 bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-2xl h-14 text-lg focus:ring-sky-500/20"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  type="button"
                  variant="ghost"
                  onClick={() => setIsSearching(false)}
                  className="text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold"
                >
                  Back
                </Button>
                <Button 
                  type="submit"
                  disabled={loading || !searchQuery.trim()}
                  className="flex-1 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-bold h-12 shadow-lg shadow-sky-500/20"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Find Facilities"}
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between px-2">
            <div className="space-y-0.5">
              <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Nearby {locationName}</h4>
              <p className="text-[9px] text-sky-600 dark:text-sky-400 font-bold flex items-center gap-1">
                <Activity className="h-2 w-2" /> Results based on your location
              </p>
            </div>
            <button onClick={() => { setFacilities([]); setLocationName(""); }} className="text-[10px] font-bold text-slate-400 hover:text-sky-600 transition-colors uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">Clear Results</button>
          </div>
          {facilities.map((fac) => (
            <div key={fac.id} className="p-5 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-sky-200 dark:hover:border-sky-900 hover:shadow-xl hover:shadow-sky-500/5 transition-all duration-300 group flex items-center justify-between gap-4">
              <div className="flex items-center gap-5">
                <div className={cn(
                  "p-4 rounded-[1.25rem] transition-all duration-300",
                  fac.type === 'hospital' ? "bg-rose-50 text-rose-500 dark:bg-rose-950/30" : "bg-sky-50 text-sky-500 dark:bg-sky-950/30"
                )}>
                  {fac.type === 'hospital' ? <Hospital className="h-6 w-6" /> : <Stethoscope className="h-6 w-6" />}
                </div>
                <div className="space-y-1.5">
                  <h5 className="font-bold text-slate-900 dark:text-white text-base line-clamp-1 leading-none">{fac.name}</h5>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                      fac.type === 'hospital' ? "bg-rose-500/10 text-rose-600 border-rose-100" : "bg-sky-500/10 text-sky-600 border-sky-100"
                    )}>
                      {fac.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <Navigation className="h-2 w-2" /> {fac.distance} km away
                    </span>
                  </div>
                </div>
              </div>
              <Button asChild size="icon" className="h-12 w-12 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl shadow-lg shadow-sky-500/20 shrink-0 transition-transform active:scale-90">
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${fac.lat},${fac.lon}`} target="_blank" rel="noopener noreferrer">
                  <Navigation className="h-5 w-5" />
                </a>
              </Button>
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-red-500 font-medium text-center">{error}</p>}
    </div>
  );
}
