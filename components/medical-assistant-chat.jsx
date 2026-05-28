"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Send, ShieldAlert, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import MedicineCard from "@/components/MedicineCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const QUICK_SUGGESTIONS = [
  "Paracetamol",
  "Amoxicillin",
  "Metformin",
  "ORS",
  "Ibuprofen",
];

const LANGUAGE_OPTIONS = ["Punjabi", "English", "Hindi", "Bengali", "Tamil", "Telugu"];

function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="sr-only">Loading</span>
      <span className="h-2 w-2 rounded-full bg-slate-400/80 animate-bounce [animation-delay:-0.2s]" />
      <span className="h-2 w-2 rounded-full bg-slate-400/80 animate-bounce [animation-delay:-0.1s]" />
      <span className="h-2 w-2 rounded-full bg-slate-400/80 animate-bounce" />
    </div>
  );
}

function detectInteractionWarning(text) {
  const t = String(text || "").toLowerCase();
  return (
    t.includes("dangerous interaction") ||
    t.includes("drug interaction") ||
    t.includes("do not take together") ||
    t.includes("do not combine") ||
    t.includes("contraindicated") ||
    t.includes("can cause severe") ||
    t.includes("risk of bleeding") ||
    t.includes("serotonin syndrome") ||
    t.includes("seek medical help immediately")
  );
}

function extractSection(text, pattern) {
  const t = String(text || "");
  const re = new RegExp(pattern, "i");
  const m = t.match(re);
  // Strip markdown bolding and trim
  return m?.[1]?.replace(/\*\*/g, "").trim() || m?.[2]?.replace(/\*\*/g, "").trim() || "";
}

function parseMedicineResponse(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;

  // Try parsing by new labels first
  let medicineName = extractSection(raw, /NAME:\s*([^\n]+)/i);
  let usedFor = extractSection(raw, /TREATS:\s*([^\n]+)/i);
  let dosage = extractSection(raw, /DOSAGE:\s*([\s\S]*?)(?=\n\d\.|\n[A-Z]+:|$)/i);
  let timing = extractSection(raw, /TIMING:\s*([^\n]+)/i);
  let sideEffectsRaw = extractSection(raw, /SIDE_EFFECTS:\s*([^\n]+)/i);
  let warning = extractSection(raw, /WARNING:\s*([\s\S]*?)(?=\n\d\.|\n[A-Z]+:|$)/i);

  // Fallback to numbered sections if labels failed
  if (!medicineName) {
    const s1 = extractSection(raw, /(?:^|\n)\s*1\s*[\.|\)]\s*([\s\S]*?)(?=\n\s*2\s*[\.|\)]|$)/i);
    const firstLine = s1.split("\n")[0].trim().replace(/\*\*/g, "");
    const m = firstLine.match(/^([^:-]{2,60})\s*[-:]\s*(.*)$/);
    if (m) {
      medicineName = m[1].trim();
      usedFor = m[2].trim();
    } else {
      medicineName = firstLine;
    }
  }

  if (!usedFor) {
    usedFor = extractSection(raw, /(?:^|\n)\s*2\s*[\.|\)]\s*([\s\S]*?)(?=\n\s*3\s*[\.|\)]|$)/i);
  }

  if (!dosage) {
    dosage = extractSection(raw, /(?:^|\n)\s*3\s*[\.|\)]\s*([\s\S]*?)(?=\n\s*4\s*[\.|\)]|$)/i);
  }

  const s3Lower = (dosage + " " + timing).toLowerCase();
  const whenBits = [];
  if (/\bmorning\b/.test(s3Lower)) whenBits.push("morning");
  if (/\bnight\b|\bbedtime\b/.test(s3Lower)) whenBits.push("night");
  if (/\bafter food\b|\bwith food\b/.test(s3Lower)) whenBits.push("with food");
  if (/\bbefore food\b|\bon empty stomach\b/.test(s3Lower))
    whenBits.push("before food / empty stomach");

  const whenToTake = whenBits.length > 0 ? whenBits.join(", ") : timing || "";

  const dosageLines = dosage.split(/\n|(?=Child|Adult|Pediatric)/i);
  const adultLine = dosageLines.find((l) => /\badult\b|\badults\b/i.test(l)) || "";
  const childLine = dosageLines.find((l) => /\bchild\b|\bchildren\b|\bpediatric\b/i.test(l)) || "";

  const dosageAdult = adultLine
    ? adultLine.replace(/^[-•\s,;:]*/g, "").replace(/adult[s]?:?/i, "").replace(/^[-•\s,;:]*/g, "").trim()
    : dosage && !childLine ? dosage.replace(/^[-•\s,;:]*/g, "").trim() : "";
  const dosageChild = childLine
    ? childLine.replace(/^[-•\s,;:]*/g, "").replace(/child(ren)?:?|pediatric:?/i, "").replace(/^[-•\s,;:]*/g, "").trim()
    : "";

  if (!sideEffectsRaw) {
    sideEffectsRaw = extractSection(raw, /(?:^|\n)\s*4\s*[\.|\)]\s*([\s\S]*?)(?=\n\s*5\s*[\.|\)]|$)/i);
  }

  const sideEffects = sideEffectsRaw
    ? sideEffectsRaw
        .replace(/side effects?/i, "")
        .split(/,|\n|•|-|\u2022|;|\//)
        .map((x) => x.trim())
        .filter((x) => x.length > 1 && !x.toLowerCase().includes("to watch for"))
        .slice(0, 12)
    : [];

  const hasDangerousInteractions = detectInteractionWarning(raw);

  // If we couldn't extract anything meaningful, skip.
  if (!medicineName && !usedFor && !whenToTake && !dosageAdult && !dosageChild && sideEffects.length === 0) {
    return null;
  }

  return {
    medicineName,
    usedFor,
    whenToTake,
    dosageAdult,
    dosageChild,
    sideEffects,
    hasDangerousInteractions,
  };
}

export function MedicalAssistantChat({ title = "Medical Assistant (AI)" }) {
  const [messages, setMessages] = useState(() => [
    {
      role: "assistant",
      content:
        "Tell me the medicine name (or your symptoms) and your age. I will explain in simple steps.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [language, setLanguage] = useState("Punjabi");
  const [isListening, setIsListening] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSeen = localStorage.getItem("has_seen_chat_voice_tooltip");
      if (!hasSeen) {
        setShowTooltip(true);
      }
    }
  }, []);

  const dismissTooltip = () => {
    setShowTooltip(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("has_seen_chat_voice_tooltip", "true");
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!SpeechRecognition) {
      const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        toast.error("Speech recognition is not supported on this browser. On iPhone/iPad, please open the site in Safari to use voice input.");
      } else {
        toast.error("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      }
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      if (language === "Punjabi") {
        recognition.lang = "pa-IN";
      } else if (language === "Hindi") {
        recognition.lang = "hi-IN";
      } else if (language === "English") {
        recognition.lang = "en-IN";
      } else {
        recognition.lang = "pa-IN";
      }

      recognition.onstart = () => {
        setIsListening(true);
        toast.info(`Voice activated. Speak in ${language}...`);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          toast.error("Microphone access denied. Please check your browser and system microphone permissions.");
        } else if (event.error === "service-not-allowed" || event.error === "language-not-supported") {
          toast.error(`Voice input for '${language}' is not active or supported on this device. Trying system default speech language...`);
          try {
            // Create a fallback recognizer using the device's native default language (does not override .lang)
            const fallbackRec = new SpeechRecognition();
            fallbackRec.continuous = false;
            fallbackRec.interimResults = false;
            fallbackRec.onstart = () => {
              setIsListening(true);
              toast.info("Voice activated using device default language. Please speak...");
            };
            fallbackRec.onresult = recognition.onresult;
            fallbackRec.onerror = (err) => {
              console.error("Fallback speech recognition error:", err.error);
              setIsListening(false);
              toast.error("Could not capture speech. Please ensure Dictation & Microphone are enabled in your device settings.");
            };
            fallbackRec.onend = recognition.onend;
            recognitionRef.current = fallbackRec;
            fallbackRec.start();
          } catch (e) {
            console.error("Speech recognition fallback failed:", e);
            toast.error("Speech recognition could not be started on this device.");
          }
        } else if (event.error === "no-speech") {
          toast.error("No speech detected. Please speak clearly into your mic.");
        } else {
          toast.error(`Voice capture failed (${event.error}). Please try again.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(prev => prev ? prev + " " + transcript : transcript);
          toast.success("Voice input added!");
          dismissTooltip();
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech recognition start failed:", err);
      setIsListening(false);
      toast.error("Failed to start voice capture.");
    }
  };

  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending]);
  const lastAssistantMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === "assistant") return messages[i]?.content || "";
    }
    return "";
  }, [messages]);
  const showInteractionWarning = useMemo(
    () => detectInteractionWarning(lastAssistantMessage),
    [lastAssistantMessage]
  );

  const send = async (text) => {
    const userText = String(text || "").trim();
    if (!userText) return;
    if (isSending) {
      toast.error("Please wait—one question at a time.");
      return;
    }

    setIsSending(true);
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setInput("");

    try {
      const nextMessages = [...messages, { role: "user", content: userText }];
      const resp = await fetch("/api/medical-assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, language }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data?.error || "Failed to get response");
      }

      const assistantText =
        String(data?.text || "").trim() ||
        "I couldn’t generate a reply. Please try again.";
      const medicineCard = parseMedicineResponse(assistantText);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantText,
          medicineCard,
        },
      ]);
    } catch (e) {
      toast.error(e?.message || "Chat error");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry—there was a technical problem. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    await send(input);
  };

  return (
    <div className="flex flex-col h-full max-h-[90dvh] sm:max-h-none sm:h-auto rounded-t-3xl sm:rounded-2xl overflow-hidden border-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl shadow-2xl flex-1">
      <div className="flex flex-col h-full flex-1">
        <div className="px-4 sm:px-5 py-6 bg-gradient-to-br from-blue-600 via-sky-600 to-blue-700 text-white rounded-t-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-bold tracking-tight truncate">{title}</h2>
              <div className="text-[10px] uppercase tracking-widest text-white/70 font-medium mt-0.5">
                Informational • Not medical advice
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="h-7 px-2 rounded-lg bg-white/10 text-white border-white/10 hover:bg-white/20 focus-visible:ring-white/30 text-[11px]">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="bg-white/10 text-white border-white/10 text-[10px] font-medium py-0 h-5">
                Groq
              </Badge>
            </div>
          </div>

          <div className="mt-4 flex overflow-x-auto flex-nowrap pb-1 gap-1.5">
            {QUICK_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className="text-[11px] px-3 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white/90 transition-all hover:scale-105 active:scale-95 shrink-0"
                onClick={() => send(s)}
                disabled={isSending}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-[300px] sm:h-[450px] overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 space-y-3 bg-white dark:bg-slate-950">
          {showInteractionWarning && (
            <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200 px-4 py-3 text-sm flex gap-2">
              <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">Warning</div>
                <div className="text-xs mt-0.5">
                  Possible dangerous medicine interaction mentioned. If you took
                  both medicines or feel unwell, seek medical help immediately.
                </div>
              </div>
            </div>
          )}

          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div
                key={idx}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <Avatar size="sm" className="mt-1 mr-2 shrink-0">
                    <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 font-bold">
                      ✚
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="max-w-[92%] sm:max-w-[78%]">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap border ${
                      isUser
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-muted text-foreground border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    {m.content}
                  </div>
                  {!isUser && m?.medicineCard ? (
                    <MedicineCard {...m.medicineCard} />
                  ) : null}
                </div>
              </div>
            );
          })}
 
          {isSending && (
            <div className="flex justify-start">
              <Avatar size="sm" className="mt-1 mr-2 shrink-0">
                <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 font-bold">
                  ✚
                </AvatarFallback>
              </Avatar>
              <div className="max-w-[92%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm border bg-muted text-foreground border-slate-200 dark:border-slate-800">
                <LoadingDots />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="px-4 sm:px-5 pt-4 pb-6 sm:pb-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
          <form onSubmit={onSubmit} className="flex gap-3 items-end">
            <div className="relative flex-1">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a medicine or symptoms…"
                className="min-h-12 max-h-40 pr-12 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-sky-500"
                disabled={isSending}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
              />
              
              {/* Voice Input Button */}
              <div className="absolute right-2 bottom-2 flex items-center">
                {showTooltip && (
                  <div className="absolute bottom-full right-0 mb-3 w-72 bg-sky-600 dark:bg-sky-700 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 z-30">
                    <div className="relative flex items-start gap-2">
                      <span>🎙️ Tap mic and speak your symptoms in Punjabi or Hindi</span>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          dismissTooltip();
                        }}
                        className="ml-auto text-white/70 hover:text-white font-extrabold text-sm leading-none shrink-0"
                      >
                        ✕
                      </button>
                      <div className="absolute top-full right-3 -translate-y-1.5 w-3 h-3 bg-sky-600 dark:bg-sky-700 rotate-45" />
                    </div>
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-lg transition-all duration-300 flex items-center justify-center cursor-pointer ${
                    isListening 
                      ? "bg-red-500 text-white animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
                      : "text-slate-400 hover:text-sky-500 dark:text-slate-500 dark:hover:text-sky-400"
                  }`}
                  title="Voice Input (Punjabi / Hindi)"
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4 animate-bounce" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="bg-sky-600 hover:bg-sky-700 h-12 px-4 rounded-xl shrink-0"
              disabled={!canSend}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

