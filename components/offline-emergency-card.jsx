"use client";

import { useState, useEffect } from "react";
import { PhoneCall, ChevronDown, ChevronUp, ShieldAlert, HeartPulse } from "lucide-react";
import { getEmergencyContacts } from "@/lib/nabha-emergency";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function OfflineEmergencyCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    setContacts(getEmergencyContacts());
  }, []);

  return (
    <div className="w-full border-2 border-red-200 dark:border-red-900/30 rounded-[1.5rem] sm:rounded-[2rem] bg-red-50/30 dark:bg-red-950/10 overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 sm:gap-4 font-sans select-none"
      >
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 sm:p-3 bg-red-500/10 rounded-xl sm:rounded-2xl text-red-500 shrink-0 animate-pulse">
            <HeartPulse className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="text-left min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">Emergency Directory</h4>
              <Badge className="bg-red-500 text-white border-0 text-[7px] sm:text-[8px] font-black tracking-widest py-0 px-1.5 uppercase rounded-full shrink-0">OFFLINE</Badge>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[200px] sm:max-w-none">Dial critical local helplines instantly</p>
          </div>
        </div>
        <div className="p-1.5 hover:bg-red-500/10 rounded-full transition-all text-red-500 shrink-0">
          {isOpen ? <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" /> : <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-5 pt-0 border-t border-red-100 dark:border-red-900/20 divide-y divide-red-100/50 dark:divide-red-900/10 animate-in slide-in-from-top-4 duration-300">
          {contacts.map((contact) => (
            <div key={contact.number} className="py-3 sm:py-4 first:pt-2 last:pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 group font-sans">
              <div className="space-y-0.5 sm:space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl shrink-0 select-none">{contact.icon}</span>
                  <h5 className="font-extrabold text-[13px] sm:text-sm text-slate-900 dark:text-white truncate">{contact.name}</h5>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 pl-6 sm:pl-7 leading-relaxed">{contact.description}</p>
              </div>
              <Button asChild size="sm" className="bg-red-600 hover:bg-red-700 text-white font-bold h-9 sm:h-10 px-3 sm:px-4 rounded-lg sm:rounded-xl shadow-md shadow-red-500/15 sm:ml-7 flex items-center justify-center gap-1.5 w-full sm:w-auto min-w-[110px] text-xs sm:text-sm">
                <a href={`tel:${contact.number}`}>
                  <PhoneCall className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Call {contact.number}</span>
                </a>
              </Button>
            </div>
          ))}
          <div className="pt-3 sm:pt-4 flex items-start gap-2 text-[9px] sm:text-[10px] text-red-500/80 leading-normal border-t border-red-100 dark:border-red-900/20">
            <ShieldAlert className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 mt-0.5" />
            <p className="italic">Numbers cached for zero-internet functionality.</p>
          </div>
        </div>
      )}
    </div>
  );
}
