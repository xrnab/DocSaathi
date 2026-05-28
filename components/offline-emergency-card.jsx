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
    <div className="w-full border-2 border-red-200 dark:border-red-900/30 rounded-[2rem] bg-red-50/30 dark:bg-red-950/10 overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 flex items-center justify-between gap-4 font-sans select-none"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 shrink-0 animate-pulse">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div className="text-left min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-tight break-words">
                Nabha Block Emergency Directory
              </h4>
              <Badge className="bg-red-500 text-white border-0 text-[8px] font-black tracking-widest py-0.5 px-2 uppercase rounded-full shrink-0">
                OFFLINE SECURE
              </Badge>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal line-clamp-1 sm:line-clamp-none">
              Dial critical Nabha hospital, local PHC, and ambulance helplines instantly
            </p>
          </div>
        </div>
        <div className="p-2 hover:bg-red-500/10 rounded-full transition-all text-red-500">
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 pt-0 border-t border-red-100 dark:border-red-900/20 divide-y divide-red-100/50 dark:divide-red-900/10 animate-in slide-in-from-top-4 duration-300">
          {contacts.map((contact) => (
            <div key={contact.number} className="py-4 first:pt-2 last:pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 group font-sans">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl shrink-0 select-none">{contact.icon}</span>
                  <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">{contact.name}</h5>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 pl-7 leading-relaxed">{contact.description}</p>
              </div>
              <Button asChild size="sm" className="bg-red-600 hover:bg-red-700 text-white font-bold h-10 px-4 rounded-xl shadow-md shadow-red-500/15 sm:ml-7 flex items-center justify-center gap-1.5 self-start sm:self-auto min-w-[120px]">
                <a href={`tel:${contact.number}`}>
                  <PhoneCall className="h-4 w-4" />
                  <span>Call {contact.number}</span>
                </a>
              </Button>
            </div>
          ))}
          <div className="pt-4 flex items-start gap-2 text-[10px] text-red-500/80 leading-normal border-t border-red-100 dark:border-red-900/20">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="italic">These critical contact numbers are cached directly in your device. They remain fully functional with zero internet connectivity or cellular data.</p>
          </div>
        </div>
      )}
    </div>
  );
}
