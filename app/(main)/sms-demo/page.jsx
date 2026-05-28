"use client";

import { useState, useRef, useEffect } from "react";
import { processIncomingSMS } from "@/actions/sms-booking";
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
  Sparkles
} from "lucide-react";

export default function SmsDemoPage() {
  const [messages, setMessages] = useState([
    { sender: "system", text: "Welcome to DocSaathi SMS Fallback Simulator.", time: "10:00 AM" },
    { sender: "incoming", text: "DocSaathi SMS Gateway is active. Text DOCTOR to find a doctor.", time: "10:01 AM" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        const res = await processIncomingSMS(finalVal);
        playBeep(600, 0.12);
        setMessages(prev => [...prev, { sender: "incoming", text: res.reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        setLoading(false);
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
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8 animate-in fade-in duration-300">
      
      {/* Title */}
      <div className="space-y-3">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 text-xs font-bold border border-sky-100 dark:border-sky-900/30">
          <WifiOff className="w-3.5 h-3.5 mr-1.5" /> Zero-Internet SMS Core Booking
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
          SMS Fallback Booking Simulator
        </h1>
        <p className="text-muted-foreground max-w-3xl text-sm md:text-base leading-relaxed">
          More than 50% of rural Indian farmers still use basic feature phones without web access. Our retro-phone simulator displays how offline patients schedule database consultations via lightweight GSM text commands.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: System Architecture Description */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                <Layers className="text-sky-500 w-5 h-5" /> GSM Gateway Architecture
              </CardTitle>
              <CardDescription>How zero-internet text messages drive cloud medical infrastructure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Step Indicators */}
              <div className="space-y-4">
                <div className="flex gap-4 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-border/40">
                  <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-sm shrink-0">1</div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">Offline GSM Dispatch</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      The patient sends a raw text query (e.g. <code>DOCTOR FEVER NABHA</code>) to a local shortcode. No mobile data or active 4G connection is needed.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-border/40">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shrink-0">2</div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm">DocSaathi NLP SMS Parser</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      The SMS Gateway processes the incoming payload, parses the keyword, filters available verified doctor schedules, and responds within 2 seconds.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-border/40">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shrink-0">3</div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">Instant DB Lock</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      Replying <code>1</code> locks the time slot in our PostgreSQL database, deducts credits, and returns an automated consultation receipt directly to the feature phone.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Template Selector */}
              <div className="pt-4 border-t border-border/60 space-y-3">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Sparkles className="text-sky-500 w-4 h-4" /> Simulator Quick-Insert Templates
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Instead of manual typing on the physical layout, click these pre-configured templates to immediately populate the simulator and trigger response loops:
                </p>
                <div className="flex flex-wrap gap-2.5 pt-1.5">
                  <button 
                    onClick={() => insertTemplate("DOCTOR FEVER NABHA")}
                    className="px-3.5 py-2 text-xs font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded-xl hover:bg-sky-100 transition-colors"
                  >
                    🔍 Find Nabha Fever Specialist
                  </button>
                  <button 
                    onClick={() => insertTemplate("1")}
                    className="px-3.5 py-2 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 transition-colors"
                  >
                    ✅ Confirm Slot 1
                  </button>
                  <button 
                    onClick={() => insertTemplate("DOCTOR")}
                    className="px-3.5 py-2 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 transition-colors"
                  >
                    📋 Generic Doctor Inquiry
                  </button>
                </div>
              </div>

              {/* Callout Info */}
              <div className="p-4 bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl text-amber-800 dark:text-amber-300 text-xs flex gap-3 leading-relaxed items-start">
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-amber-900 dark:text-amber-200 mb-0.5">Real DB Synchronisation</h5>
                  <p>
                    When you confirm a booking in the simulated Nokia phone on the right, a real appointment record gets committed in the PostgreSQL database. You can instantly verify it on the Doctor Dashboard or your Appointments history!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Retro Phone Mockup */}
        <div className="lg:col-span-5 flex justify-center">
          
          {/* Outer Phone Shell */}
          <div className="w-[320px] bg-slate-800 dark:bg-slate-900 rounded-[45px] p-4.5 border-4 border-slate-700 shadow-2xl relative flex flex-col items-center">
            
            {/* Speaker Grille and Brand */}
            <div className="flex flex-col items-center w-full mb-3 space-y-1">
              <div className="w-16 h-1.5 bg-slate-950 rounded-full border-t border-slate-600" />
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase select-none font-mono">SAATHI 3310</span>
            </div>

            {/* Simulated Phone Screen */}
            <div className="w-full bg-[#cbd5e1] text-slate-950 font-mono text-[11px] p-3 rounded-2xl h-[330px] border-4 border-slate-950 shadow-inner flex flex-col justify-between select-none relative overflow-hidden">
              
              {/* Screen Top Status Bar */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-1 mb-1 text-[10px] font-bold text-slate-800">
                <span className="flex items-center gap-0.5">📶 JIO IN</span>
                <span>12:00 PM</span>
                <span>🔋 100%</span>
              </div>

              {/* Chat Thread Area */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                {messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`flex flex-col ${msg.sender === "outgoing" ? "items-end" : "items-start"}`}
                  >
                    <div className={`p-2 rounded-xl max-w-[85%] border leading-tight ${
                      msg.sender === "outgoing"
                        ? "bg-slate-950 text-[#cbd5e1] border-slate-950 rounded-tr-none"
                        : msg.sender === "system"
                        ? "bg-slate-400/30 text-slate-800 border-slate-400/40 rounded-none w-full text-center text-[10px]"
                        : "bg-slate-200 text-slate-950 border-slate-300 rounded-tl-none font-black"
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[8px] text-slate-600 font-bold mt-0.5 px-1">{msg.time}</span>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center space-x-1 pl-2">
                    <span className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Screen Bottom SMS Input Bar */}
              <div className="mt-2 border-t border-slate-800 pt-2 flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Type command..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="bg-transparent border-none outline-none flex-1 text-slate-950 placeholder-slate-700/60 font-mono text-[11px] font-bold"
                />
                <button 
                  onClick={() => handleSendSms()}
                  disabled={loading || !inputValue.trim()}
                  className="text-slate-900 hover:text-black shrink-0 disabled:opacity-30"
                >
                  <Send className="w-4 h-4 fill-slate-900" />
                </button>
              </div>
            </div>

            {/* Retro Phone Physical Buttons Layout */}
            <div className="grid grid-cols-3 gap-x-6 gap-y-3 w-full px-4 mt-6">
              
              {/* Menu and Call keys */}
              <button 
                onClick={() => playBeep(1200, 0.08)}
                className="h-7 bg-slate-700 hover:bg-slate-600 rounded-lg border border-slate-600 text-[10px] font-bold text-slate-300 shadow-sm"
              >
                Menu
              </button>
              <button 
                onClick={() => playBeep(1500, 0.1)}
                className="h-7 bg-emerald-700 hover:bg-emerald-600 rounded-lg border border-emerald-600 text-white flex items-center justify-center shadow-sm"
              >
                📞
              </button>
              <button 
                onClick={() => { playBeep(500, 0.2); setMessages([messages[0]]); }}
                className="h-7 bg-rose-800 hover:bg-rose-700 rounded-lg border border-rose-700 text-white flex items-center justify-center shadow-sm"
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
                { label: "#", alpha: "↑aA" }
              ].map((key) => (
                <button
                  key={key.label}
                  onClick={() => {
                    playBeep(1000, 0.04);
                    if (key.label === "0") setInputValue(p => p + " ");
                    else if (key.label !== "*" && key.label !== "#") setInputValue(p => p + key.label);
                  }}
                  className="flex flex-col items-center justify-center h-11 bg-slate-700 hover:bg-slate-600 rounded-xl border border-slate-600 text-slate-200 shadow-md font-mono active:scale-95 transition-transform"
                >
                  <span className="text-base font-black leading-none">{key.label}</span>
                  <span className="text-[7px] font-semibold text-slate-400 mt-0.5 tracking-wider uppercase leading-none">{key.alpha}</span>
                </button>
              ))}
            </div>

            {/* Nokia Bottom Ports Mockup */}
            <div className="flex gap-4 mt-6 justify-center w-full">
              <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-700 shadow-inner" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-950 border border-slate-700 shadow-inner" />
              <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-700 shadow-inner" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
