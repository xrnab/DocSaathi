"use client";

import { useState, useEffect, useCallback } from "react";
import { getPusherClient } from "@/lib/pusher";
import { getQueueStatus, callNextPatient, toggleQueueActive } from "@/actions/telemedicine";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowRight, Loader2, PlayCircle, StopCircle, User, Users } from "lucide-react";

export default function DoctorQueuePanel({ doctorId }) {
  const [loading, setLoading] = useState(true);
  const [queueState, setQueueState] = useState({
    currentToken: 0,
    totalTokens: 0,
    avgMinutes: 10,
    isActive: false,
    queue: []
  });
  const [calling, setCalling] = useState(false);
  const [toggling, setToggling] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await getQueueStatus(doctorId);
      if (res.success) {
        setQueueState({
          currentToken: res.currentToken,
          totalTokens: res.totalTokens,
          avgMinutes: res.avgMinutes,
          isActive: res.isActive,
          queue: res.queue || []
        });
      }
    } catch (e) {
      console.error("Failed to fetch doctor queue status:", e);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchStatus();
    
    // Fallback poll every 30s
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(`queue-${doctorId}`);

    channel.bind("patient-joined", (data) => {
      toast.success(`Patient joined: Token #${data.token} (${data.patientName})`);
      fetchStatus();
    });

    channel.bind("token-called", (data) => {
      fetchStatus();
    });

    channel.bind("queue-active-changed", (data) => {
      setQueueState(prev => ({ ...prev, isActive: data.isActive }));
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`queue-${doctorId}`);
    };
  }, [doctorId, fetchStatus]);

  const handleCallNext = async () => {
    if (!queueState.isActive) {
      toast.warning("Please activate the queue before calling patients.");
      return;
    }
    setCalling(true);
    try {
      const res = await callNextPatient(doctorId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.patientName 
          ? `Token #${res.calledToken} called: ${res.patientName}`
          : `Token #${res.calledToken} called.`
        );
        fetchStatus();
      }
    } catch (err) {
      toast.error("Failed to transition queue: " + err.message);
    } finally {
      setCalling(false);
    }
  };

  const handleToggleActive = async (checked) => {
    setToggling(true);
    try {
      const res = await toggleQueueActive(doctorId, checked);
      if (res.error) {
        toast.error(res.error);
      } else {
        setQueueState(prev => ({ ...prev, isActive: res.isActive }));
        toast.success(res.isActive ? "Telemedicine queue opened." : "Telemedicine queue closed.");
      }
    } catch (err) {
      toast.error("Failed to toggle queue state: " + err.message);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 text-sky-500 animate-spin" />
      </div>
    );
  }

  const waitingPatients = queueState.queue.filter(p => p.token > queueState.currentToken);

  return (
    <Card className="border-sky-100 dark:border-sky-900 shadow-sm bg-card rounded-2xl overflow-hidden">
      <div className="bg-sky-500/10 p-4 border-b border-sky-100 dark:border-sky-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Telemedicine Queue</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
            {queueState.isActive ? "Open" : "Closed"}
          </span>
          <Switch 
            checked={queueState.isActive} 
            onCheckedChange={handleToggleActive} 
            disabled={toggling} 
          />
        </div>
      </div>

      <CardContent className="p-5 space-y-5">
        {/* Serving Console */}
        <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl text-center border border-border/60">
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Serving Right Now</p>
          <div className="text-4xl font-black text-foreground mt-2 leading-none">
            {queueState.currentToken === 0 ? "None" : `Token #${queueState.currentToken}`}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 font-medium">
            Total tokens issued today: {queueState.totalTokens}
          </p>
        </div>

        {/* Action button */}
        <Button
          onClick={handleCallNext}
          disabled={calling || toggling || waitingPatients.length === 0 || !queueState.isActive}
          className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold h-11 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-sky-600/10 cursor-pointer"
        >
          {calling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Call Next Patient
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>

        {/* Queue List */}
        <div className="space-y-2.5">
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">Waiting List ({waitingPatients.length})</p>
          
          {waitingPatients.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground italic border-2 border-dashed border-border/80 rounded-xl">
              No patients waiting in queue
            </div>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1.5 scrollbar-thin">
              {waitingPatients.map((patient, idx) => (
                <div 
                  key={patient.id} 
                  className="flex items-center justify-between p-3 bg-white dark:bg-slate-950 border border-border/50 rounded-xl shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-7 w-7 rounded-lg bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-black text-xs flex items-center justify-center border border-sky-200/30">
                      #{patient.token}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-foreground truncate max-w-[120px]">{patient.patientName}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Est: ~{idx * queueState.avgMinutes} min wait
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-slate-100 border-none text-slate-600 text-[9px] font-black uppercase tracking-wider rounded-md">
                    Waiting
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
