"use client";

import { useState, useEffect } from "react";
import { getPusherClient } from "@/lib/pusher";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle, ExternalLink, MapPin, Navigation, Siren } from "lucide-react";
import { updateEmergencyStatus } from "@/actions/emergency";

export function EmergencyClient({ initialEmergencies }) {
  const [emergencies, setEmergencies] = useState(initialEmergencies);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe("emergency-channel");

    channel.bind("new-emergency", (data) => {
      // Create a unified format matching server payloads
      const newEmergency = {
        id: data.id,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        status: "ACTIVE",
        message: data.message,
        createdAt: new Date(data.createdAt),
        patient: {
          name: data.patientName,
          village: data.address || "Live Coordinates",
        },
      };

      toast.error(`🚨 EMERGENCY SOS: ${data.patientName} needs urgent help!`, {
        duration: 12000,
        description: data.message || "No description provided.",
      });

      // Attempt to play an alert tone if user interaction allowed
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav");
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {}

      setEmergencies((prev) => [newEmergency, ...prev]);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe("emergency-channel");
    };
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const res = await updateEmergencyStatus(id, newStatus);
      if (res.success) {
        toast.success(`Emergency updated to ${newStatus.toLowerCase()}`);
        setEmergencies((prev) =>
          prev
            .map((item) =>
              item.id === id ? { ...item, status: newStatus } : item
            )
            .filter((item) => item.status !== "RESOLVED")
        );
      }
    } catch (err) {
      toast.error("Failed to update status: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-5 flex items-center justify-between shadow-sm select-none">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-red-500/20">
            <Siren className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground tracking-wide uppercase">Real-Time Dispatch Console</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Listening live for emergency broadcasts across Nabha</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Live Connection</span>
        </div>
      </div>

      {emergencies.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 border-2 border-dashed border-border rounded-3xl">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground">All Quiet</h3>
          <p className="text-muted-foreground text-sm mt-1">There are currently no active emergency SOS dispatches.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {emergencies.map((item) => (
            <Card 
              key={item.id} 
              className={`border transition-all duration-300 rounded-2xl overflow-hidden ${
                item.status === "ACTIVE" 
                  ? "border-red-500 bg-red-500/5 shadow-md shadow-red-500/5 animate-in fade-in zoom-in-95" 
                  : "border-amber-500 bg-amber-500/5 shadow-xs"
              }`}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-extrabold text-lg text-foreground leading-tight">
                        {item.patient?.name || "Anonymous Patient"}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`font-black uppercase tracking-wider text-[9px] px-2 py-0.5 rounded-full ${
                          item.status === "ACTIVE"
                            ? "bg-red-600 border-red-600 text-white animate-pulse"
                            : "bg-amber-500 border-amber-500 text-white"
                        }`}
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Reported {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {item.latitude && item.longitude && (
                      <a
                        href={`https://maps.google.com?q=${item.latitude},${item.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 h-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-wider rounded-xl transition-all border border-border cursor-pointer"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        Open in Maps
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {item.status === "ACTIVE" && (
                      <Button
                        size="sm"
                        disabled={updatingId === item.id}
                        onClick={() => handleUpdateStatus(item.id, "RESPONDING")}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-9 rounded-xl px-4 shadow-sm"
                      >
                        Mark Responding
                      </Button>
                    )}
                    <Button
                      size="sm"
                      disabled={updatingId === item.id}
                      onClick={() => handleUpdateStatus(item.id, "RESOLVED")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 rounded-xl px-4 shadow-sm"
                    >
                      Mark Resolved
                    </Button>
                  </div>
                </div>

                {item.message && (
                  <div className="bg-background dark:bg-slate-950/40 p-4 rounded-xl border border-border/80 text-sm text-foreground italic leading-relaxed">
                    &ldquo;{item.message}&rdquo;
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center text-xs text-muted-foreground font-semibold gap-3 sm:gap-6">
                  <span className="flex items-center gap-1.5">
                    <Navigation className="h-3.5 w-3.5 text-sky-400" />
                    Coordinates: {item.latitude && item.longitude ? `${item.latitude.toFixed(6)}, ${item.longitude.toFixed(6)}` : "Unavailable"}
                  </span>
                  {item.patient?.village && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                      Region: {item.patient.village}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
