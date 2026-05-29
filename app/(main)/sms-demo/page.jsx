"use client";

import { useState, useRef, useEffect } from "react";
import { processIncomingSMS, getSmsBookedAppointments } from "@/actions/sms-booking";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  PhoneCall, 
  MessageSquare, 
  WifiOff, 
  Database, 
  ArrowRight, 
  Send,
  Zap,
  Info,
  Layers,
  Sparkles,
  Video,
  Calendar,
  UserCheck,
  Clock
} from "lucide-react";

export default function SmsDemoPage() {
  const [messages, setMessages] = useState([
    { sender: "system", text: "Welcome to DocSaathi SMS Fallback Simulator.", time: "10:00 AM" },
    { sender: "incoming", text: "DocSaathi SMS Gateway is active. Text DOCTOR to find a doctor.", time: "10:01 AM" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [smsState, setSmsState] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const threadRef = useRef(null);

  // Play a retro physical keypress beep
  const playBeep = (freq = 800, duration = 0.05) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("AudioContext block", e);
    }
  };

  const fetchAppointments = async () => {
    const data = await getSmsBookedAppointments();
    setAppointments(data);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Internal scrolling to prevent global page jump
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendSms = async (textToSend = null) => {
    const finalVal = (textToSend || inputValue).trim();
    if (!finalVal) return;

    playBeep(900, 0.08);
    setMessages(prev => [...prev, { sender: "outgoing", text: finalVal, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setInputValue("");
    setLoading(true);

    try {
      // Simulate network delay over zero-internet SMS network
      setTimeout(async () => {
        const res = await processIncomingSMS(finalVal, smsState);
        playBeep(600, 0.12);
        setMessages(prev => [...prev, { sender: "incoming", text: res.reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        setSmsState(res.newState);
        setLoading(false);
        if (res.success && res.appointmentId) {
          fetchAppointments();
        }
      }, 1000);
    } catch (err) {
      setMessages(prev => [...prev, { sender: "incoming", text: "DocSaathi: Connection error on SMS network.", time: "Now" }]);
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendSms();
    } else {
      playBeep(800, 0.03);
    }
  };

  const insertTemplate = (text) => {
    setInputValue(text);
    playBeep(1000, 0.05);
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 pt-0 pb-8 sm:pt-0 sm:pb-12 max-w-7xl space-y-4 lg:space-y-0 animate-in fade-in duration-300">
      
      {/* Title */}
      <div className="space-y-2 text-center lg:text-left px-2 lg:mb-4">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 text-[10px] sm:text-xs font-bold border border-sky-100 dark:border-sky-900/30">
          <WifiOff className="w-3.5 h-3.5 mr-1.5" /> Zero-Internet SMS Core Booking
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
          SMS Fallback Booking <br className="hidden sm:block" /> Simulator
        </h1>
        <p className="text-muted-foreground max-w-2xl text-xs sm:text-sm md:text-base leading-relaxed mx-auto lg:mx-0">
          Our retro-phone simulator displays how offline patients schedule consultations via GSM text commands.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* Right Column: Retro Phone Mockup (Moved to top on mobile) */}
        <div className="lg:col-span-5 order-first lg:order-last flex justify-center w-full overflow-hidden px-1 lg:-mt-48 xl:-mt-60 relative z-20">
          
          {/* Outer Phone Shell */}
          <div className="w-[280px] xs:w-[310px] lg:w-[240px] xl:w-[270px] bg-slate-800 dark:bg-slate-900 rounded-[35px] sm:rounded-[45px] p-3 sm:p-4 border-4 border-slate-700 shadow-2xl relative flex flex-col items-center">
            
            {/* Speaker Grille and Brand */}
            <div className="flex flex-col items-center w-full mb-2 space-y-1">
              <div className="w-10 sm:w-14 h-1 bg-slate-950 rounded-full border-t border-slate-600" />
              <span className="text-[8px] sm:text-[9px] font-black tracking-widest text-slate-400 uppercase select-none font-mono">SAATHI 3310</span>
            </div>

            {/* Simulated Phone Screen */}
            <div className="w-full bg-[#cbd5e1] text-slate-950 font-mono text-[9px] sm:text-[10px] p-2 sm:p-2.5 rounded-2xl h-[240px] sm:h-[300px] lg:h-[210px] xl:h-[260px] border-4 border-slate-950 shadow-inner flex flex-col justify-between select-none relative overflow-hidden">
              
              {/* Screen Top Status Bar */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-1 mb-1 text-[8px] sm:text-[9px] font-bold text-slate-800">
                <span className="flex items-center gap-0.5">📶 JIO</span>
                <span>12:00</span>
                <span>🔋 100%</span>
              </div>

              {/* Chat Thread Area */}
              <div 
                ref={threadRef}
                className="flex-1 overflow-y-auto space-y-1 sm:space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800"
              >
                {messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`flex flex-col ${msg.sender === "outgoing" ? "items-end" : "items-start"}`}
                  >
                    <div className={`p-1.5 rounded-lg max-w-[95%] border leading-tight ${
                      msg.sender === "outgoing"
                        ? "bg-slate-950 text-[#cbd5e1] border-slate-950 rounded-tr-none"
                        : msg.sender === "system"
                        ? "bg-slate-400/30 text-slate-800 border-slate-400/40 rounded-none w-full text-center text-[8px] sm:text-[9px]"
                        : "bg-slate-200 text-slate-950 border-slate-300 rounded-tl-none font-black"
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[6px] sm:text-[7px] text-slate-600 font-bold mt-0.5 px-1">{msg.time}</span>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center space-x-1 pl-2">
                    <span className="w-1 h-1 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1 h-1 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1 h-1 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </div>

              {/* Screen Bottom SMS Input Bar */}
              <div className="mt-1 border-t border-slate-800 pt-1.5 flex items-center gap-1">
                <input
                  type="text"
                  placeholder="..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="bg-transparent border-none outline-none flex-1 text-slate-950 placeholder-slate-700/60 font-mono text-[9px] sm:text-[10px] font-bold"
                />
                <button 
                  onClick={() => handleSendSms()}
                  disabled={loading || !inputValue.trim()}
                  className="text-slate-900 hover:text-black shrink-0 disabled:opacity-30"
                >
                  <Send className="w-3 h-3 sm:w-3.5 h-3.5 fill-slate-900" />
                </button>
              </div>
            </div>

            {/* Retro Phone Physical Buttons Layout */}
            <div className="grid grid-cols-3 gap-x-3 sm:gap-x-5 gap-y-1.5 sm:gap-y-2 w-full px-1 sm:px-3 mt-3 sm:mt-4">
              
              {/* Menu and Call keys */}
              <button 
                onClick={() => playBeep(1200, 0.08)}
                className="h-5 sm:h-6 bg-slate-700 hover:bg-slate-600 rounded-lg border border-slate-600 text-[8px] sm:text-[9px] font-bold text-slate-300 shadow-sm"
              >
                Menu
              </button>
              <button 
                onClick={() => playBeep(1500, 0.1)}
                className="h-5 sm:h-6 bg-emerald-700 hover:bg-emerald-600 rounded-lg border border-emerald-600 text-white flex items-center justify-center shadow-sm text-[10px]"
              >
                📞
              </button>
              <button 
                onClick={() => { playBeep(500, 0.2); setMessages([messages[0]]); setSmsState(null); }}
                className="h-5 sm:h-6 bg-rose-800 hover:bg-rose-700 rounded-lg border border-rose-700 text-white flex items-center justify-center shadow-sm text-[9px]"
              >
                ✖
              </button>

              {/* Keypad Grid */}
              {[
                { label: "1", alpha: "o_o" },
                { label: "2", alpha: "ABC" },
                { label: "3", alpha: "DEF" },
                { label: "4", alpha: "GHI" },
                { label: "5", alpha: "JKL" },
                { label: "6", alpha: "MNO" },
                { label: "7", alpha: "PQRS" },
                { label: "8", alpha: "TUV" },
                { label: "9", alpha: "WXYZ" },
                { label: "*", alpha: "+-/" },
                { label: "0", alpha: "SPACE" },
                { label: "#", alpha: "↑" }
              ].map((key) => (
                <button
                  key={key.label}
                  onClick={() => {
                    playBeep(1000, 0.04);
                    if (key.label === "0") setInputValue(p => p + " ");
                    else if (key.label !== "*" && key.label !== "#") setInputValue(p => p + key.label);
                  }}
                  className="flex flex-col items-center justify-center h-8 sm:h-10 bg-slate-700 hover:bg-slate-600 rounded-xl border border-slate-600 text-slate-200 shadow-md font-mono active:scale-95 transition-transform"
                >
                  <span className="text-xs sm:text-sm font-black leading-none">{key.label}</span>
                  <span className="text-[5px] sm:text-[6px] font-semibold text-slate-400 mt-0.5 tracking-wider uppercase leading-none">{key.alpha}</span>
                </button>
              ))}
            </div>

            {/* Nokia Bottom Ports Mockup */}
            <div className="flex gap-3 mt-3 sm:mt-5 justify-center w-full">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-slate-950 border border-slate-700 shadow-inner" />
              <div className="w-1 h-1 rounded-full bg-slate-950 border border-slate-700 shadow-inner" />
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-slate-950 border border-slate-700 shadow-inner" />
            </div>
          </div>
        </div>

        {/* Left Column: System Architecture Description */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-6">
          
          {/* Active SMS Bookings & Video Call Portal */}
          <Card className="border-emerald-500/20 bg-emerald-950/5 dark:bg-emerald-950/10 shadow-sm rounded-3xl overflow-hidden border">
            <CardHeader className="p-4 sm:p-6 pb-2 bg-emerald-500/10">
              <CardTitle className="text-lg sm:text-xl font-extrabold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Video className="w-5 h-5 animate-pulse" /> Active Video Consultations
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-emerald-800/80 dark:text-emerald-300/80">
                Join your scheduled virtual booth consultations instantly once booked.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              {appointments.length === 0 ? (
                <div className="text-center py-6 px-4 border border-dashed border-emerald-500/20 rounded-2xl bg-white/40 dark:bg-black/10">
                  <Calendar className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
                    No scheduled consultations found.
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground/80 mt-1 max-w-sm mx-auto">
                    Use the retro phone simulator on the right to search for a doctor and book a consultation instantly!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((app) => {
                    const localTimeStr = new Date(app.startTime).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                      timeZone: "Asia/Kolkata",
                    });
                    const localDateStr = new Date(app.startTime).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      timeZone: "Asia/Kolkata",
                    });

                    return (
                      <div 
                        key={app.id} 
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-emerald-500/20 rounded-2xl shadow-sm hover:border-emerald-500/40 transition-all animate-in slide-in-from-bottom-2 duration-300"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 relative flex">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <h4 className="font-black text-foreground text-xs sm:text-sm">
                              {app.doctor.name}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold border border-emerald-200/40 shrink-0">
                              {app.doctor.specialty || "General"}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-[10px] sm:text-xs font-medium">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-emerald-500/70" /> {localDateStr}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-emerald-500/70" /> {localTimeStr}
                            </span>
                            <span className="text-[9px] text-muted-foreground/60 font-mono">
                              ID: {app.id.substring(0,8)}
                            </span>
                          </div>
                        </div>
                        <Link 
                          href={`/video-call?appointmentId=${app.id}&from=sms-demo`}
                          className="w-full sm:w-auto"
                        >
                          <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 transition-all hover:-translate-y-0.5 active:translate-y-0 shrink-0">
                            <Video className="w-4 h-4" /> Join Video Call
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm rounded-3xl">
            <CardHeader className="p-4 sm:p-6 pb-2">
              <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-foreground">
                <Layers className="text-sky-500 w-5 h-5" /> GSM Gateway Architecture
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">How zero-internet text messages drive cloud medical infrastructure.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              
              {/* Step Indicators */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-border/40">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">1</div>
                  <div>
                    <h4 className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-1.5">Offline GSM Dispatch</h4>
                    <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed mt-0.5">
                      The patient sends a raw text query (e.g. <code>DOCTOR FEVER</code>) to a local shortcode. No mobile data or active 4G connection is needed.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-border/40">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">2</div>
                  <div>
                    <h4 className="font-bold text-foreground text-xs sm:text-sm">DocSaathi NLP Parser</h4>
                    <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed mt-0.5">
                      The SMS Gateway processes the incoming payload, parses keywords, and identifies potential doctors or available slots.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-border/40">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">3</div>
                  <div>
                    <h4 className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-1.5">Instant DB Lock</h4>
                    <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed mt-0.5">
                      Confirming a slot locks the appointment in our database, deducts credits, and returns an automated receipt to the feature phone.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Template Selector */}
              <div className="pt-4 border-t border-border/60 space-y-3">
                <h4 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                  <Sparkles className="text-sky-500 w-4 h-4" /> Quick-Insert Templates
                </h4>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                  Follow the multi-step flow to book a consultation:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button 
                    onClick={() => insertTemplate("DOCTOR FEVER NABHA")}
                    className="px-3 py-2 text-[10px] sm:text-xs font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded-xl hover:bg-sky-100 transition-colors"
                  >
                    🔍 Step 1: Find Doctor
                  </button>
                  <button 
                    onClick={() => insertTemplate("1")}
                    className="px-3 py-2 text-[10px] sm:text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 transition-colors"
                  >
                    ✅ Step 2/3: Reply '1'
                  </button>
                  <button 
                    onClick={() => { setSmsState(null); setMessages([messages[0]]); }}
                    className="px-3 py-2 text-[10px] sm:text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl hover:bg-rose-100 transition-colors"
                  >
                    🔄 Reset Conversation
                  </button>
                </div>
              </div>

              {/* Callout Info */}
              <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl text-amber-800 dark:text-amber-300 text-[10px] sm:text-xs flex gap-3 leading-relaxed items-start">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-amber-900 dark:text-amber-200 mb-0.5">Real DB Synchronisation</h5>
                  <p>
                    Confirming a booking in the simulated phone commits a real appointment record in the PostgreSQL database!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
