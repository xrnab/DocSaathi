"use client";

import { useState, useEffect } from "react";
import { getPusherClient } from "@/lib/pusher";
import { joinQueue } from "@/actions/telemedicine";
import { toast } from "sonner";
import { AlertCircle, Clock, Users, Volume2 } from "lucide-react";

export default function QueueStatusCard({ doctorId, appointmentId }) {
  const [loading, setLoading] = useState(true);
  const [myToken, setMyToken] = useState(null);
  const [currentToken, setCurrentToken] = useState(0);
  const [position, setPosition] = useState(0);
  const [estimatedWait, setEstimatedWait] = useState(0);
  const [avgMinutes, setAvgMinutes] = useState(10);
  const [error, setError] = useState(null);

  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // high pitched ping
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Audio Context play failed:", e);
    }
  };

  useEffect(() => {
    async function initQueue() {
      setLoading(true);
      try {
        const res = await joinQueue(appointmentId);
        if (res.error) {
          setError(res.error);
        } else {
          setMyToken(res.token);
          setCurrentToken(res.currentToken || 0);
          setPosition(res.position);
          setEstimatedWait(res.estimatedWait);
        }
      } catch (err) {
        setError(err.message || "Failed to load queue details.");
      } finally {
        setLoading(false);
      }
    }

    initQueue();
  }, [appointmentId]);

  useEffect(() => {
    if (!myToken) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(`queue-${doctorId}`);

    channel.bind("token-called", (data) => {
      const serving = data.token;
      setCurrentToken(serving);
      
      // Recalculate position
      const newPos = Math.max(0, myToken - serving - 1);
      setPosition(newPos);
      setEstimatedWait(newPos * avgMinutes);
      
      toast.info(`Token #${serving} is now being served.`);
    });

    // Also listen on the user channel directly for direct turns
    // The main app layout user channel or user ID is required.
    // For direct user channel your-turn event:
    const pusherClient = getPusherClient();
    // Listening to user turn
    const userChannel = pusherClient.subscribe(`queue-${doctorId}`); // fallback to queue channel for updates
    userChannel.bind("your-turn", (data) => {
      // If the called token matches myToken, play sound and alert
      toast.success("🔔 It's your turn! Join the video call now.", { duration: 10000 });
      playBeep();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`queue-${doctorId}`);
    };
  }, [myToken, doctorId, avgMinutes]);

  // Handle immediate beep triggers if position reaches 0
  useEffect(() => {
    if (myToken && currentToken === myToken) {
      playBeep();
    }
  }, [currentToken, myToken]);

  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-sky-100 dark:border-sky-900 bg-sky-50/20 dark:bg-sky-950/10 p-6 space-y-4">
        <div className="h-4 bg-muted rounded w-20 mx-auto" />
        <div className="h-16 bg-muted rounded w-24 mx-auto" />
        <div className="h-6 bg-muted rounded w-48 mx-auto" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/30 p-4 text-xs font-semibold text-red-600 flex items-start gap-2.5">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <span>Queue unavailable: {error}</span>
      </div>
    );
  }

  const isMyTurn = myToken <= currentToken;

  return (
    <div className="rounded-2xl border border-sky-200 dark:border-sky-900 bg-sky-50/50 dark:bg-sky-950/25 p-6 text-center space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">Live Token Queue</span>
        <Volume2 className="h-4 w-4 text-sky-400 cursor-pointer hover:text-sky-500 transition-colors" onClick={playBeep} />
      </div>
      
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Token</p>
        <div className="text-7xl font-black text-sky-600 dark:text-sky-400 leading-none py-2">{myToken}</div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 text-sm py-2">
        <div className="px-2">
          <p className="font-black text-lg text-foreground leading-none">{currentToken}</p>
          <p className="text-muted-foreground text-[10px] font-bold uppercase mt-1.5 flex items-center justify-center gap-0.5"><Clock className="h-3 w-3" /> Serving</p>
        </div>
        <div className="px-2">
          <p className="font-black text-lg text-foreground leading-none">{isMyTurn ? 0 : position}</p>
          <p className="text-muted-foreground text-[10px] font-bold uppercase mt-1.5 flex items-center justify-center gap-0.5"><Users className="h-3 w-3" /> Ahead</p>
        </div>
        <div className="px-2">
          <p className="font-black text-lg text-foreground leading-none">~{isMyTurn ? 0 : estimatedWait}m</p>
          <p className="text-muted-foreground text-[10px] font-bold uppercase mt-1.5 flex items-center justify-center gap-0.5"><Clock className="h-3 w-3" /> Wait</p>
        </div>
      </div>

      {isMyTurn && (
        <div className="bg-emerald-500 text-white rounded-xl p-3.5 font-extrabold text-sm animate-pulse flex items-center justify-center gap-2 border border-emerald-400 shadow-md shadow-emerald-500/10">
          🔔 It&apos;s your turn! Join the video call now.
        </div>
      )}
    </div>
  );
}
