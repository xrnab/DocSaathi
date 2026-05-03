"use client";

import { useState, useEffect } from "react";
import { User, Paperclip, Send, Mic, Video, Phone, CheckCheck, SignalHigh, WifiOff, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function TelemedicineChatPage({ params }) {
  const [isOffline, setIsOffline] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: "doctor", text: "Hello! How can I help you today?", time: "10:00 AM", status: "read" },
  ]);
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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: "patient",
      text: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: isOffline ? "pending" : "sent"
    };

    setMessages([...messages, newMessage]);
    setInputMessage("");
  };

  // Simulate network coming back online and sending pending messages
  useEffect(() => {
    if (!isOffline) {
      setMessages(prev => prev.map(m => m.status === "pending" ? { ...m, status: "sent" } : m));
    }
  }, [isOffline]);

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-card rounded-3xl overflow-hidden border shadow-2xl shadow-sky-900/10 dark:shadow-sky-900/20">
      {/* Header / Doctor Profile Card */}
      <div className="bg-sky-50 dark:bg-sky-900/20 border-b border-sky-100 dark:border-sky-800/40 p-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-sky-200 dark:border-sky-700 shadow-sm">
            <AvatarImage src="" />
            <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-800 dark:text-sky-300 font-semibold">DR</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-lg leading-tight text-foreground">Dr. Sarah Jenkins</h2>
            <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">General Physician</p>
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
          <Button variant="ghost" size="icon" className="h-9 w-9 text-sky-600 dark:text-sky-400 hover:text-sky-700 hover:bg-sky-100 dark:hover:bg-sky-900/50 rounded-full">
            <Video className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50 relative">
        <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-800/50 pointer-events-none [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        {messages.map((msg) => (
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
        ))}
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
            <Button type="button" size="icon" variant="secondary" className="rounded-full text-sky-600 bg-sky-100 hover:bg-sky-200 dark:bg-sky-900/30 dark:hover:bg-sky-900/50 flex-shrink-0 transition-all">
              <Mic className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
