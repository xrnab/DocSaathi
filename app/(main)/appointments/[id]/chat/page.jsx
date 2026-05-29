"use client";

import { useState, useEffect } from "react";
import { User, Paperclip, Send, Mic, Video, Phone, CheckCheck, SignalHigh, WifiOff, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import VoiceNoteRecorder from "@/components/voice-note-recorder";
import { getUserRole } from "@/actions/records";
import { getAppointmentDetails } from "@/actions/appointments";
import { saveChatMessage, getChatMessages } from "@/actions/telemedicine";
import { format } from "date-fns";
import dynamic from "next/dynamic";

const PatientBriefingCard = dynamic(() => import("@/components/patient-briefing-card"), { ssr: false });
const QueueStatusCard = dynamic(() => import("@/components/queue-status-card"), { ssr: false });

export default function TelemedicineChatPage({ params }) {
  const [isOffline, setIsOffline] = useState(false);
  const [appointmentId, setAppointmentId] = useState("");
  const [userRole, setUserRole] = useState("PATIENT");
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [isBriefingOpen, setIsBriefingOpen] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  useEffect(() => {
    Promise.resolve(params).then(p => {
      if (p?.id) setAppointmentId(p.id);
    });
  }, [params]);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const role = await getUserRole();
        if (role) setUserRole(role);
      } catch (err) {
        console.error("Error fetching user role:", err);
      }
    }
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (!appointmentId) return;

    async function fetchChatData() {
      try {
        setIsLoadingMessages(true);
        const details = await getAppointmentDetails(appointmentId);
        if (details) {
          setAppointment(details);
        }

        const dbMessages = await getChatMessages(appointmentId);
        if (dbMessages && dbMessages.length > 0) {
          setMessages(dbMessages.map(m => ({
            id: m.id,
            sender: m.senderRole === "DOCTOR" ? "doctor" : "patient",
            text: m.text,
            time: format(new Date(m.createdAt), "h:mm a"),
            status: "read"
          })));
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error("Error fetching chat data:", err);
      } finally {
        setIsLoadingMessages(false);
      }
    }

    fetchChatData();
  }, [appointmentId]);

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");

  useEffect(() => {
    function handleOnline() { setIsOffline(false); }
    function handleOffline() { setIsOffline(true); }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
    }
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const messageText = inputMessage;
    setInputMessage("");

    const newMessage = {
      id: Date.now().toString(),
      sender: userRole === "DOCTOR" ? "doctor" : "patient",
      text: messageText,
      time: format(new Date(), "h:mm a"),
      status: isOffline ? "pending" : "sent"
    };

    setMessages(prev => [...prev, newMessage]);

    if (!isOffline) {
      try {
        await saveChatMessage(appointmentId, messageText, userRole);
      } catch (err) {
        console.error("Failed to save chat message:", err);
      }
    }
  };

  // Simulate network coming back online and sending pending messages
  useEffect(() => {
    if (!isOffline) {
      setMessages(prev => prev.map(m => m.status === "pending" ? { ...m, status: "sent" } : m));
    }
  }, [isOffline]);

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] grid grid-cols-12 gap-6 px-2 sm:px-4">
      {/* Main Chat Container */}
      <div className={`flex flex-col bg-card rounded-3xl overflow-hidden border shadow-2xl shadow-sky-900/10 dark:shadow-sky-900/20 h-full transition-all duration-350 ${
        userRole === "DOCTOR" && isBriefingOpen 
          ? "col-span-12 lg:col-span-8" 
          : "col-span-12 max-w-3xl mx-auto w-full"
      }`}>
        {/* Header / Doctor Profile Card */}
        <div className="bg-sky-50 dark:bg-sky-900/20 border-b border-sky-100 dark:border-sky-800/40 p-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-sky-200 dark:border-sky-700 shadow-sm">
              <AvatarImage src={userRole === "DOCTOR" ? (appointment?.patient?.imageUrl || "") : (appointment?.doctor?.imageUrl || "")} />
              <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-800 dark:text-sky-300 font-semibold">DR</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-lg leading-tight text-foreground">
                {userRole === "DOCTOR" ? (appointment?.patient?.name || "Patient") : (appointment?.doctor?.name ? `Dr. ${appointment.doctor.name}` : "Doctor")}
              </h2>
              <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">
                {userRole === "DOCTOR" ? "Patient Profile" : (appointment?.doctor?.specialty || "Specialist")}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Connection Quality Indicator */}
            <div className="flex items-center mr-2">
              {isOffline ? (
                <span className="flex items-center text-xs text-destructive bg-destructive/10 px-2 py-1 rounded-full font-medium">
                  <WifiOff className="h-3 w-3 mr-1" /> Offline
                </span>
              ) : (
                <span className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full font-medium shadow-sm">
                  <SignalHigh className="h-3 w-3 mr-1" /> Good
                </span>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-sky-600 dark:text-sky-400 hover:text-sky-700 hover:bg-sky-100 dark:hover:bg-sky-900/50 rounded-full">
              <Phone className="h-4 w-4" />
            </Button>
            {messages.length > 0 && (
              <Button asChild variant="outline" className="h-9 border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-full px-3 py-1 font-bold text-xs flex items-center gap-1.5 cursor-pointer">
                <a 
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `DocSaathi Appointment Chat Summary:\n\n` + 
                    messages.map(m => `[${m.sender === "doctor" ? "Doctor" : "Patient"}] ${m.text}`).join("\n") +
                    `\n\nView prescription details securely at: ${typeof window !== "undefined" ? window.location.href : ""}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Share Summary
                </a>
              </Button>
            )}
            {appointmentId && (
              <Button asChild variant="ghost" className="h-9 text-sky-600 dark:text-sky-400 hover:text-sky-700 hover:bg-sky-100 dark:hover:bg-sky-900/50 rounded-full px-3 py-1 font-bold text-xs flex items-center gap-1.5">
                <Link href={`/video-call?appointmentId=${appointmentId}&from=appointments`}>
                  <Video className="h-4 w-4" />
                  Join Call
                </Link>
              </Button>
            )}
            {userRole === "DOCTOR" && (
              <Button 
                type="button"
                onClick={() => setIsBriefingOpen(!isBriefingOpen)}
                variant="outline" 
                className={`h-9 font-bold rounded-full px-3 py-1 text-xs cursor-pointer gap-1.5 transition-all shadow-xs border ${
                  isBriefingOpen
                    ? "bg-sky-100 border-sky-300 text-sky-700 hover:bg-sky-200 dark:bg-sky-900/30 dark:border-sky-800 dark:text-sky-300"
                    : "border-sky-200 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/10"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-sky-500 animate-pulse" />
                {isBriefingOpen ? "Hide AI Brief" : "Show AI Brief"}
              </Button>
            )}
          </div>
        </div>

        {userRole === "PATIENT" && appointment?.status === "SCHEDULED" && appointment?.doctorId && (
          <div className="p-4 bg-background border-b border-border">
            <QueueStatusCard doctorId={appointment.doctorId} appointmentId={appointmentId} />
          </div>
        )}

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50 relative">
          <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-800/50 pointer-events-none [mask-image:linear-gradient(to_bottom,white,transparent)]" />
          {isLoadingMessages ? (
            <div className="flex flex-col gap-4 py-8 relative z-10 w-full">
              <div className="flex justify-start">
                <div className="bg-slate-200 dark:bg-slate-800 animate-pulse h-12 w-2/3 rounded-2xl rounded-tl-sm" />
              </div>
              <div className="flex justify-end">
                <div className="bg-slate-200 dark:bg-slate-800 animate-pulse h-10 w-1/2 rounded-2xl rounded-tr-sm" />
              </div>
              <div className="flex justify-start">
                <div className="bg-slate-200 dark:bg-slate-800 animate-pulse h-14 w-3/4 rounded-2xl rounded-tl-sm" />
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex relative z-10 ${msg.sender === "patient" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] md:max-w-[70%] rounded-2xl p-3 shadow-sm ${
                  msg.sender === "patient" 
                    ? "bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-tr-sm" 
                    : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-tl-sm"
                }`}>
                  <p className="text-sm">{msg.text}</p>
                  <div className={`flex items-center justify-end gap-1 mt-1 ${msg.sender === "patient" ? "text-sky-100" : "text-muted-foreground"}`}>
                    <span className="text-[10px]">{msg.time}</span>
                    {msg.sender === "patient" && (
                      <span className="ml-1">
                        {msg.status === "pending" ? <Clock className="h-3 w-3 opacity-70" /> : <CheckCheck className="h-3 w-3" />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input Area */}
        <div className="p-3 sm:p-4 bg-background border-t border-sky-100 dark:border-sky-900/30">
          {isOffline && (
            <p className="text-xs text-amber-600 dark:text-amber-500 mb-2 px-2 flex items-center">
              <WifiOff className="h-3 w-3 mr-1 inline" />
              Messages will be sent when you're back online.
            </p>
          )}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-full flex-shrink-0" title="Attach Prescription">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message or attach prescription..." 
              className="flex-1 rounded-full bg-slate-100 dark:bg-slate-800 border-transparent focus-visible:ring-1 focus-visible:ring-sky-500"
            />
            {inputMessage.trim() ? (
              <Button type="submit" size="icon" className="rounded-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white flex-shrink-0 shadow-md shadow-sky-500/20 transition-all hover:scale-105">
                <Send className="h-4 w-4 -ml-0.5" />
              </Button>
            ) : (
              <Dialog open={isRecordDialogOpen} onOpenChange={setIsRecordDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" size="icon" variant="secondary" className="rounded-full text-sky-600 bg-sky-100 hover:bg-sky-200 dark:bg-sky-900/30 dark:hover:bg-sky-900/50 flex-shrink-0 transition-all">
                    <Mic className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-2xl border-sky-100 dark:border-sky-900/30">
                  <DialogHeader>
                    <DialogTitle className="text-center font-bold text-sky-700 dark:text-sky-400">
                      Voice Note Consultation
                    </DialogTitle>
                  </DialogHeader>
                  <VoiceNoteRecorder
                    appointmentId={appointmentId}
                    fromRole={userRole}
                    onSaved={async (newMsg) => {
                      setMessages((prev) => [...prev, newMsg]);
                      setIsRecordDialogOpen(false);
                      try {
                        await saveChatMessage(appointmentId, newMsg.text, userRole);
                      } catch (err) {
                        console.error("Failed to save voice note chat message:", err);
                      }
                    }}
                    onClose={() => setIsRecordDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
          </form>
        </div>
      </div>

      {/* Doctor-only Collapsible Side Briefing Panel */}
      {userRole === "DOCTOR" && isBriefingOpen && (
        <div className="col-span-12 lg:col-span-4 h-full flex flex-col gap-4 bg-card rounded-3xl border p-5 shadow-2xl shadow-sky-900/5 border-sky-100/50 dark:border-sky-900/30 overflow-hidden animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-500 animate-pulse" />
              Clinical AI Briefing
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsBriefingOpen(false)}
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground h-7 rounded-lg hover:bg-muted/50 cursor-pointer"
            >
              Close
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-4">
            {appointmentId ? (
              <PatientBriefingCard appointmentId={appointmentId} />
            ) : (
              <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">
                Initializing briefing...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
