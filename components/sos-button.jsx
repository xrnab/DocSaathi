"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle2, Loader2, Phone } from "lucide-react";
import { createEmergencyRequest } from "@/actions/emergency";
import { toast } from "sonner";

export default function SOSButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);

  const triggerSOS = async (useLocation) => {
    setLoading(true);
    setError(null);

    const submitSOS = async (lat = null, lng = null) => {
      try {
        const res = await createEmergencyRequest(lat, lng, null, message);
        if (res.success) {
          setSent(true);
          toast.error("🚨 EMERGENCY DISPATCHED: DocSaathi Admin and nearest health workers have been notified.");
        }
      } catch (err) {
        setError(err.message || "Failed to dispatch SOS alert.");
        toast.error("Failed to send SOS: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (useLocation && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await submitSOS(position.coords.latitude, position.coords.longitude);
        },
        async (err) => {
          console.warn("Geolocation denied or failed, sending SOS without coordinates.", err);
          toast.warning("Location access denied. Dispatching SOS without coordinates.");
          await submitSOS(null, null);
        },
        { timeout: 10000 }
      );
    } else {
      await submitSOS(null, null);
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset state after transition
    setTimeout(() => {
      setSent(false);
      setMessage("");
      setError(null);
      setLoading(false);
    }, 300);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(val) => {
        if (!val) handleClose();
        else setOpen(true);
      }}>
        <DialogTrigger asChild>
          <button
            id="global-sos-btn"
            className="fixed bottom-24 sm:bottom-6 right-6 z-[99] w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white font-black text-[10px] flex flex-col items-center justify-center shadow-2xl border-4 border-white dark:border-slate-900 cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none"
          >
            {/* Pulsing red ring behind button */}
            <span className="absolute inset-0 rounded-full bg-red-600/50 animate-ping group-hover:animate-none opacity-75" />
            
            <AlertTriangle className="h-6 w-6 relative z-10 text-white drop-shadow-sm" />
            <span className="relative z-10 tracking-widest font-black uppercase mt-0.5">SOS</span>
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md border-red-500 bg-background shadow-2xl rounded-3xl overflow-hidden p-6 z-[999]">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
              Send Emergency SOS Alert
            </DialogTitle>
          </DialogHeader>

          {sent ? (
            <div className="text-center py-6 space-y-5 animate-in zoom-in-95 duration-300">
              <div className="bg-emerald-500/10 p-4 rounded-full inline-flex border border-emerald-500/20 text-emerald-500">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">Emergency Alert Sent!</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                  Your coordinates and profile details have been successfully broadcasted. DocSaathi health workers and administrators have been dispatched.
                </p>
              </div>

              <div className="pt-4 border-t border-border flex flex-col gap-3">
                <a 
                  href="tel:108"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-black rounded-xl h-12 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Phone className="h-5 w-5 animate-bounce" /> Call 108 Ambulance
                </a>
                <Button 
                  onClick={handleClose} 
                  variant="outline" 
                  className="w-full rounded-xl font-bold border-slate-200 dark:border-slate-800"
                >
                  Close & Monitor Status
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Need urgent medical assistance? We will capture your coordinates and instantly notify the nearest DocSaathi health worker to respond to your exact location.
              </p>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Describe Emergency (Optional)</label>
                <Textarea
                  placeholder="e.g. Sharp chest pain, difficulty breathing, high fever, accident details..."
                  className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl h-24 text-sm resize-none focus:ring-red-500 focus:border-red-500"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="text-xs font-semibold text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 rounded-xl animate-shake select-none">
                  {error}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                <Button
                  onClick={() => triggerSOS(true)}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/10 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "📍 Send with Location"
                  )}
                </Button>
                <Button
                  onClick={() => triggerSOS(false)}
                  disabled={loading}
                  variant="outline"
                  className="sm:w-1/3 rounded-xl font-bold h-12 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Send Without
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
