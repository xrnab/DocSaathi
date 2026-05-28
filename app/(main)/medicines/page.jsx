"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Search, MapPin, Navigation, Clock, Pill, Store, Filter, Phone, Loader2, AlertCircle, Map as MapIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getNearbyPharmacies, geocodeLocation } from "@/actions/pharmacy";
import { MedicalAssistantChat } from "@/components/medical-assistant-chat";

// Dynamic import for Leaflet Map to avoid SSR errors
const HealthMap = dynamic(() => import("@/components/map"), { 
  ssr: false, 
  loading: () => (
    <div className="w-full h-full bg-sky-50/50 dark:bg-sky-900/10 animate-pulse flex flex-col items-center justify-center text-sky-400">
      <MapIcon className="h-10 w-10 mb-3 opacity-50" />
      <span className="text-sm font-medium">Loading Interactive Map...</span>
    </div>
  )
});

const NABHA_JAN_AUSHADHI = {
  id: "nabha_jan_aushadhi",
  name: "PM Bhartiya Jan Aushadhi Kendra (Civil Hospital Nabha)",
  address: "Inside Lt Gen Shivdev Singh Civil Hospital, Nabha, Patiala, Punjab - 147201",
  distance: 0.0,
  lat: 30.3762,
  lng: 76.1427,
  phone: "1800-180-8080",
  hours: "09:00 AM - 05:00 PM (Sunday Closed)",
  status: "Government Scheme Store",
  isJanAushadhi: true
};

export default function MedicinesDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [radius, setRadius] = useState("5"); // default 5km
  const [pharmacies, setPharmacies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [showScrollChip, setShowScrollChip] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollChip(false);
    };

    const timer = setTimeout(() => {
      if (window.scrollY < 50) {
        setShowScrollChip(true);
      }
    }, 2000);

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const displayedPharmacies = (() => {
    let list = [...pharmacies];

    let janAushadhiStore = { ...NABHA_JAN_AUSHADHI };
    if (userLocation) {
      const lat1 = userLocation.lat;
      const lon1 = userLocation.lng;
      const lat2 = 30.3762;
      const lon2 = 76.1427;
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const d = R * c;
      janAushadhiStore.distance = Number(d.toFixed(1));
    }

    const matchesSearch = !searchQuery || 
      janAushadhiStore.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      janAushadhiStore.address.toLowerCase().includes(searchQuery.toLowerCase());

    const isWithinRadius = !userLocation || janAushadhiStore.distance <= parseFloat(radius);

    if (matchesSearch && isWithinRadius) {
      list = [janAushadhiStore, ...list.filter(p => p.id !== janAushadhiStore.id)];
    } else if (filterType === "jan-aushadhi") {
      list = [janAushadhiStore];
    }

    if (filterType === "jan-aushadhi") {
      return list.filter(p => p.isJanAushadhi || p.name.toLowerCase().includes("jan aushadhi"));
    }

    return list;
  })();

  const fetchPharmacies = async (lat, lng, rad, keyword) => {
    setIsLoading(true);
    setErrorMsg("");
    
    try {
      const result = await getNearbyPharmacies(lat, lng, parseFloat(rad), keyword);
      if (result.error) {
        setErrorMsg("Error: " + result.error);
        setPharmacies([]);
      } else {
        setPharmacies(result.pharmacies);
      }
    } catch (err) {
      setErrorMsg("Failed to connect to OpenStreetMap API.");
      setPharmacies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const locateUser = () => {
    setIsLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationQuery("My Location");
          fetchPharmacies(latitude, longitude, radius, searchQuery);
        },
        (err) => {
          console.warn("Geolocation failed/denied. Falling back to Nabha coords:", err);
          const defaultLat = 30.3762;
          const defaultLng = 76.1427;
          setUserLocation({ lat: defaultLat, lng: defaultLng });
          setLocationQuery("Nabha");
          fetchPharmacies(defaultLat, defaultLng, radius, searchQuery);
        }
      );
    } else {
      console.warn("Geolocation not supported. Falling back to Nabha coords.");
      const defaultLat = 30.3762;
      const defaultLng = 76.1427;
      setUserLocation({ lat: defaultLat, lng: defaultLng });
      setLocationQuery("Nabha");
      fetchPharmacies(defaultLat, defaultLng, radius, searchQuery);
    }
  };

  useEffect(() => {
    // Try to get GPS on initial load
    locateUser();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    // If they typed a custom location, geocode it first
    if (locationQuery && locationQuery !== "My Location") {
      const geo = await geocodeLocation(locationQuery);
      if (geo.error) {
        setErrorMsg("Could not find that location. Try a different city or village.");
        setIsLoading(false);
        return;
      }
      setUserLocation({ lat: geo.lat, lng: geo.lng });
      setLocationQuery(geo.displayName.split(",")[0]); // Just show the primary name
      fetchPharmacies(geo.lat, geo.lng, radius, searchQuery);
    } else if (userLocation) {
      fetchPharmacies(userLocation.lat, userLocation.lng, radius, searchQuery);
    } else {
      locateUser(); // Try again
    }
  };

  const handleRadiusChange = (val) => {
    setRadius(val);
    if (userLocation) {
      fetchPharmacies(userLocation.lat, userLocation.lng, val, searchQuery);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Verified":
        return <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-400 hover:bg-sky-200 border-sky-200">Verified</Badge>;
      case "24/7 Available":
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400 hover:bg-emerald-200 border-emerald-200">24/7 Available</Badge>;
      case "Home Delivery":
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400 hover:bg-purple-200 border-purple-200">Home Delivery</Badge>;
      case "Government Scheme Store":
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-sm">Govt Scheme</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4 sm:px-0">
      <PageHeader title="Pharmacy Locator" backLink="/" backLabel="Home" />

      {errorMsg && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-amber-800 dark:text-amber-400 p-3 rounded-xl flex items-center gap-2 text-sm shadow-sm animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Map and Filters Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column: Search & List */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-sky-200 dark:border-sky-800 bg-card/50 backdrop-blur-sm shadow-sm rounded-2xl">
            <CardContent className="p-4 sm:p-6 space-y-4">
              <form onSubmit={handleSearch} className="flex flex-col gap-4">
                
                {/* Location Input */}
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sky-600 dark:text-sky-400" />
                  <Input
                    placeholder="Enter City or Village..."
                    className="pl-12 h-12 text-sm sm:text-md rounded-full border-sky-200 dark:border-sky-800 focus-visible:ring-sky-500 shadow-sm bg-background"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 text-sky-600 hover:bg-sky-100 rounded-full h-8 sm:h-9 px-2 sm:px-3 text-[10px] sm:text-xs"
                    onClick={locateUser}
                  >
                    GPS
                  </Button>
                </div>

                {/* Search & Radius */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sky-600 dark:text-sky-400" />
                    <Input
                      placeholder="Search pharmacy..."
                      className="pl-12 h-12 text-sm sm:text-md rounded-full border-sky-200 dark:border-sky-800 focus-visible:ring-sky-500 shadow-sm bg-background w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Select value={radius} onValueChange={handleRadiusChange}>
                      <SelectTrigger className="flex-1 sm:w-[130px] h-12 rounded-full border-sky-200 dark:border-sky-800 bg-background shadow-sm text-sm">
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                          <SelectValue placeholder="Range" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 km</SelectItem>
                        <SelectItem value="5">5 km</SelectItem>
                        <SelectItem value="10">10 km</SelectItem>
                        <SelectItem value="25">25 km</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="submit" size="icon" className="h-12 w-12 rounded-full bg-sky-600 hover:bg-sky-700 shrink-0 shadow-sm">
                      <Search className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/60 rounded-2xl w-fit border border-slate-200/40 dark:border-slate-800/40 animate-in fade-in slide-in-from-top-2 duration-300">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 sm:px-5 py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${
                filterType === "all"
                  ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-md"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              All Stores
            </button>
            <button
              onClick={() => setFilterType("jan-aushadhi")}
              className={`px-3 sm:px-5 py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-1 sm:gap-1.5 ${
                filterType === "jan-aushadhi"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/10"
                  : "text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400"
              }`}
            >
              <Pill className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-bounce" />
              Jan Aushadhi
            </button>
          </div>

          <div className="space-y-4 relative min-h-[300px]">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-2xl">
                <Loader2 className="h-8 w-8 text-sky-500 animate-spin mb-4" />
                <p className="text-muted-foreground font-medium animate-pulse">Scanning area for pharmacies...</p>
              </div>
            ) : null}

            {!isLoading && displayedPharmacies.length > 0 ? (
              displayedPharmacies.map((pharmacy, index) => (
                <Card 
                  key={pharmacy.id} 
                  className="overflow-hidden hover:shadow-md transition-all duration-300 border-sky-100 dark:border-sky-900 rounded-2xl animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      <div className="p-5 flex-1 space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base sm:text-lg flex items-start gap-2 text-foreground leading-tight">
                              <Store className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
                              <span className="break-words">{pharmacy.name}</span>
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground flex items-start gap-1.5 mt-2">
                              <MapPin className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" /> 
                              <span className="break-words">{pharmacy.address}</span>
                            </p>
                            <p className="text-xs sm:text-sm text-sky-600 dark:text-sky-400 font-medium ml-5 mt-1">
                              {pharmacy.distance} km away
                            </p>
                          </div>
                          <div className="flex-shrink-0 mt-1">
                            {getStatusBadge(pharmacy.status)}
                          </div>
                        </div>
                        
                        <div className="flex items-center text-xs sm:text-sm text-muted-foreground gap-1.5 pt-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" /> 
                          <span className="break-words">Hours: {pharmacy.hours}</span>
                        </div>
                      </div>
                      
                      <div className="bg-sky-50/50 dark:bg-sky-900/10 p-4 sm:p-5 flex flex-col items-center justify-center gap-3 border-t sm:border-t-0 sm:border-l border-sky-100 dark:border-sky-800 w-full sm:w-auto sm:min-w-[160px]">
                        <Button 
                          asChild
                          className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-md shadow-sky-500/20 rounded-full transition-all hover:scale-105 h-10 px-4 text-sm"
                        >
                          <a href={`https://www.openstreetmap.org/directions?engine=graphhopper_car&route=${userLocation?.lat || ''},${userLocation?.lng || ''};${pharmacy.lat},${pharmacy.lng}`} target="_blank" rel="noopener noreferrer">
                            <Navigation className="h-3.5 w-3.5 mr-2" />
                            Get Directions
                          </a>
                        </Button>
                        
                        {pharmacy.phone ? (
                          <Button 
                            asChild
                            variant="outline"
                            className="w-full border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/40 rounded-full transition-all h-10 px-4 text-sm"
                          >
                            <a href={`tel:${pharmacy.phone}`}>
                              <Phone className="h-3.5 w-3.5 mr-2" />
                              Call Store
                            </a>
                          </Button>
                        ) : (
                          <Button variant="outline" disabled className="w-full rounded-full h-10 px-4 text-xs text-muted-foreground border-dashed">
                            No Phone Tag
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : !isLoading ? (
              <div className="text-center py-16 bg-card rounded-3xl border border-dashed border-sky-200 dark:border-sky-800 shadow-sm animate-in fade-in">
                <div className="w-20 h-20 bg-sky-50 dark:bg-sky-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="h-10 w-10 text-sky-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No pharmacies found</h3>
                <p className="text-muted-foreground max-w-md mx-auto px-4">
                  We couldn't find any pharmacies within {radius}km of this location. Try expanding your search radius.
                </p>
                <Button variant="outline" className="mt-6 rounded-full border-sky-200" onClick={() => handleRadiusChange("25")}>
                  Expand to 25 km
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Column: Interactive Map */}
        <div className="lg:col-span-2 h-[220px] sm:h-[320px] lg:h-[440px] sticky top-24 rounded-3xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl shadow-sky-900/10">
          <HealthMap userLocation={userLocation} items={displayedPharmacies} type="Pharmacy" />
        </div>
      </div>

      <div className="pt-2">
        <MedicalAssistantChat title="Pharmacy Assistant" />
      </div>

      {showScrollChip && (
        <div 
          className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-sky-600 dark:bg-sky-500 text-white font-black px-5 py-3 rounded-full shadow-2xl shadow-sky-500/20 text-xs animate-bounce flex items-center gap-1.5 cursor-pointer border border-sky-400/30"
          onClick={() => window.scrollBy({ top: 400, behavior: 'smooth' })}
        >
          Scroll for results ⬇
        </div>
      )}
    </div>
  );
}
