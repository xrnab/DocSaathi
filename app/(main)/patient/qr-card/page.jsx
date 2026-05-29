"use client";

import { useState, useEffect } from "react";
import { generatePatientQR } from "@/actions/patient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, MapPin, AlertTriangle, ArrowLeft, Heart, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function PatientQRCardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadQR() {
      try {
        const result = await generatePatientQR();
        if (result.error) {
          setError(result.error);
        } else {
          setData(result);
        }
      } catch (err) {
        console.error("Error loading QR:", err);
        setError("An unexpected error occurred while loading your QR Card.");
      } finally {
        setLoading(false);
      }
    }
    loadQR();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 text-sky-500 animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Generating your secure QR Health Card...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-4">
        <div className="h-12 w-12 bg-red-100 dark:bg-red-950/20 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mx-auto">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Generation Failed</h2>
        <p className="text-sm text-muted-foreground">{error || "Failed to load patient records."}</p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/patients">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  const { qrDataUrl, patient } = data;
  const dobFormatted = patient.dateOfBirth ? format(new Date(patient.dateOfBirth), "MMM d, yyyy") : "Not provided";

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-0 space-y-8 animate-in fade-in duration-300 print:p-0 print:my-0">
      
      {/* Back Navigation Bar (Hidden on print) */}
      <div className="flex items-center justify-between print:hidden">
        <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground rounded-full">
          <Link href="/patients">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Link>
        </Button>
        
        <Button 
          onClick={() => window.print()} 
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl gap-2 shadow-md shadow-sky-600/10 cursor-pointer"
        >
          <Printer className="h-4 w-4" /> Print Patient Card
        </Button>
      </div>

      <div className="text-center print:hidden space-y-2">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Your Digital QR Health Card</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Print this card or keep it on your phone. ASHA workers can scan the QR code to instantly pull up your medical credentials and schedule consultations.
        </p>
      </div>

      {/* Card Wrapper & Proportions (85mm x 54mm) */}
      <div className="flex justify-center py-6 print:py-0 print:m-0">
        <div 
          id="patient-qr-card" 
          className="w-[85mm] h-[54mm] bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-5 shadow-2xl relative overflow-hidden border border-slate-800 flex flex-col justify-between shrink-0 select-none print:shadow-none print:border print:border-slate-800 print:rounded-3xl print:w-[85mm] print:h-[54mm] print:m-0 print:bg-gradient-to-br print:from-slate-900 print:to-indigo-950 print:text-white"
        >
          {/* Card subtle aesthetics background */}
          <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 w-32 h-32 bg-sky-500/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 transform -translate-x-12 translate-y-12 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Top Row: Logo & Blood Type */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2 z-10">
            <div className="flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-sky-400 fill-sky-400" />
              <span className="font-black text-sm uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-300">
                DocSaathi
              </span>
            </div>
            <Badge className="bg-red-500 hover:bg-red-500 text-white font-extrabold px-2 py-0 text-[10px] uppercase rounded-md tracking-wider">
              {patient.bloodType || "O+"}
            </Badge>
          </div>

          {/* Middle Section: Patient Details (Left) and QR Code (Right) */}
          <div className="flex-1 flex items-center justify-between gap-4 mt-3 z-10">
            <div className="flex-1 space-y-1 min-w-0">
              <h2 className="text-base font-black truncate leading-tight text-white">{patient.name}</h2>
              <p className="text-[9px] font-mono text-slate-400 tracking-wider truncate uppercase">
                ID: {patient.id.slice(0, 13)}...
              </p>
              
              <div className="flex items-center gap-3 pt-1">
                <span className="flex items-center text-[9px] text-slate-300 font-semibold">
                  <MapPin className="h-2.5 w-2.5 mr-0.5 text-sky-400" /> {patient.village || "Punjab"}
                </span>
                <span className="flex items-center text-[9px] text-slate-300 font-semibold">
                  <Calendar className="h-2.5 w-2.5 mr-0.5 text-sky-400" /> {dobFormatted}
                </span>
              </div>
              
              <div className="pt-2 border-t border-white/5 mt-2">
                <p className="text-[7px] text-slate-400 uppercase font-black tracking-wider leading-none">Emergency Allergies</p>
                <p className="text-[9px] font-bold text-red-400 truncate mt-0.5 max-w-[140px] leading-tight">
                  {patient.allergies || "None reported"}
                </p>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-1 rounded-xl shadow-md border border-white/20 shrink-0">
              <img 
                src={qrDataUrl} 
                alt="Patient QR Code" 
                className="w-[34mm] h-[34mm] object-contain block"
              />
            </div>
          </div>
        </div>
      </div>

      {/* CSS Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
            background: none !important;
          }
          
          #patient-qr-card,
          #patient-qr-card * {
            visibility: visible;
          }

          #patient-qr-card {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            margin: 0 !important;
            box-shadow: none !important;
            border: 1px solid #1e293b !important;
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          @page {
            size: auto;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
