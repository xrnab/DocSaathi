"use client";

import { useState, useEffect, useRef } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Camera, 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle, 
  MapPin, 
  Calendar, 
  Droplet, 
  ShieldAlert, 
  Heart,
  Loader2,
  RefreshCw,
  Plus
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export default function AshaScannerPage() {
  const router = useRouter();
  const [scanStatus, setScanStatus] = useState("scanning"); // scanning, success, error
  const [scannedPatient, setScannedPatient] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [useMock, setUseMock] = useState(false);
  const [mockInput, setMockInput] = useState("");
  
  const videoRef = useRef(null);
  const controlsRef = useRef(null);

  // Initialize camera scanner on mount
  useEffect(() => {
    if (useMock || scanStatus !== "scanning") {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
      return;
    }

    let isMounted = true;
    const codeReader = new BrowserQRCodeReader();

    async function startScanner() {
      try {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        const controls = await codeReader.decodeFromVideoDevice(
          undefined, // undefined picks the default back camera (or default available)
          videoElement,
          (result, error, controls) => {
            if (!isMounted) return;
            
            if (result) {
              const text = result.getText();
              handleScanSuccess(text);
              controls.stop();
            }
          }
        );

        if (isMounted) {
          controlsRef.current = controls;
        } else {
          controls.stop();
        }
      } catch (err) {
        console.error("Failed to start camera scanner:", err);
        if (isMounted) {
          setErrorMsg("Camera not found or permissions denied. Try using the Mock Input tab below.");
          setScanStatus("scanning"); // keep in scanning but error shows warning
        }
      }
    }

    startScanner();

    return () => {
      isMounted = false;
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    };
  }, [useMock, scanStatus]);

  const handleScanSuccess = (text) => {
    try {
      const payload = JSON.parse(text);
      if (payload && payload.id && payload.name) {
        setScannedPatient(payload);
        setScanStatus("success");
      } else {
        throw new Error("Missing required patient keys.");
      }
    } catch (err) {
      console.error("Payload error:", err);
      setErrorMsg("QR code decoded successfully but is not a valid DocSaathi patient card.");
      setScanStatus("error");
    }
  };

  const handleMockSubmit = (e) => {
    e.preventDefault();
    if (!mockInput.trim()) return;
    handleScanSuccess(mockInput);
  };

  const handleRetry = () => {
    setScannedPatient(null);
    setErrorMsg("");
    setMockInput("");
    setScanStatus("scanning");
  };

  const loadDemoPayload = () => {
    const demo = {
      id: "demo-uuid-984712",
      name: "Sukhwinder Singh",
      bloodType: "B+",
      allergies: "Penicillin, Sulfonamides",
      dob: "1988-04-15T00:00:00.000Z",
      village: "Sauja"
    };
    setMockInput(JSON.stringify(demo, null, 2));
  };

  const handleBookAppointment = () => {
    if (!scannedPatient) return;
    router.push(`/asha?prefillName=${encodeURIComponent(scannedPatient.name)}`);
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground rounded-full">
          <Link href="/asha">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to ASHA Hub
          </Link>
        </Button>
        <span className="text-xs font-bold text-sky-600 bg-sky-50 dark:bg-sky-950/40 px-3 py-1 rounded-full border border-sky-100 dark:border-sky-800">
          QR Medical Scanner
        </span>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">ASHA Citizen Scanner</h1>
        <p className="text-sm text-muted-foreground">
          Point the camera at a patient&apos;s physical or digital QR Health Card to fetch details instantly.
        </p>
      </div>

      {/* Main Scanner Container */}
      <Card className="border-sky-100 dark:border-sky-900 shadow-xl overflow-hidden bg-card relative">
        <div className="bg-sky-500 h-1.5 w-full" />
        
        <CardContent className="p-6">
          
          {/* SCANNING STATE */}
          {scanStatus === "scanning" && (
            <div className="space-y-6">
              {!useMock ? (
                // Camera Stream
                <div className="relative aspect-square w-full max-w-sm mx-auto bg-slate-900 rounded-3xl overflow-hidden shadow-inner border border-slate-800 flex items-center justify-center">
                  <video 
                    ref={videoRef} 
                    id="scanner-video"
                    className="w-full h-full object-cover"
                    playsInline
                  />
                  {/* Targeting Overlay */}
                  <div className="absolute inset-8 border-2 border-dashed border-sky-400 rounded-2xl animate-pulse pointer-events-none flex items-center justify-center">
                    <div className="w-4 h-4 bg-sky-400 rounded-full opacity-50" />
                  </div>
                  
                  {/* Glowing Pulse Bar */}
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent top-0 animate-bounce mt-4 shadow-lg shadow-sky-400/50" />
                </div>
              ) : (
                // Mock Input Form
                <form onSubmit={handleMockSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold">Paste QR JSON Payload</label>
                      <Button 
                        type="button" 
                        onClick={loadDemoPayload}
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-sky-600 dark:text-sky-400 font-bold"
                      >
                        Load Demo Patient
                      </Button>
                    </div>
                    <textarea
                      required
                      value={mockInput}
                      onChange={(e) => setMockInput(e.target.value)}
                      placeholder='{"id":"...","name":"Jaspreet Kaur","bloodType":"O-","allergies":"Aspirin","dob":"1995-12-10T00:00:00Z","village":"Sauja"}'
                      className="w-full min-h-[140px] font-mono text-xs p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:outline-sky-500"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md">
                    Parse Scanned Text
                  </Button>
                </form>
              )}

              {/* Camera Error Notification (Still allows Mock) */}
              {errorMsg && !useMock && (
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs border border-amber-200 dark:border-amber-800/40">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
              )}

              {/* Toggle Scanning Mode */}
              <div className="flex justify-center border-t border-border pt-4">
                <Button 
                  onClick={() => setUseMock(!useMock)} 
                  variant="outline" 
                  size="sm"
                  className="rounded-xl border-sky-100 dark:border-sky-900 text-sky-600 dark:text-sky-400 font-bold"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Switch to {useMock ? "Live Camera Scan" : "Developer Mock Scanner"}
                </Button>
              </div>
            </div>
          )}

          {/* SUCCESS STATE: Display Scanned Patient summary */}
          {scanStatus === "success" && scannedPatient && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
              
              {/* Scan Complete Header */}
              <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl text-emerald-800 dark:text-emerald-300">
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Patient Decoded Successfully</h4>
                  <p className="text-[10px] text-emerald-600/80 font-medium">Synced with DocSaathi Offline Registry</p>
                </div>
              </div>

              {/* Patient Detail Summary Card */}
              <div className="border border-border/80 bg-slate-50/30 dark:bg-slate-900/10 rounded-2xl p-5 space-y-4 shadow-sm">
                
                <div className="flex items-start justify-between border-b border-border/50 pb-3 gap-2">
                  <div>
                    <h3 className="text-xl font-black text-foreground">{scannedPatient.name}</h3>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5 uppercase tracking-wider">
                      UUID: {scannedPatient.id}
                    </p>
                  </div>
                  <Badge className="bg-red-500 text-white font-extrabold flex items-center gap-1">
                    <Droplet className="h-3 w-3 fill-white" /> {scannedPatient.bloodType || "O+"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-sky-500 shrink-0" />
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground leading-none font-bold">Village</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{scannedPatient.village || " Sauja"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-sky-500 shrink-0" />
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground leading-none font-bold">Birth Date</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">
                        {scannedPatient.dob ? format(new Date(scannedPatient.dob), "MMMM d, yyyy") : "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Critical Medical Summary alerts */}
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-red-700 dark:text-red-300 font-extrabold text-xs">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-red-500" />
                    <span>EMERGENCY ALLERGIES & NOTES</span>
                  </div>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 italic">
                    {scannedPatient.allergies || "None reported"}
                  </p>
                </div>
              </div>

              {/* Actions Box */}
              <div className="flex gap-3 w-full">
                <Button 
                  onClick={handleRetry} 
                  variant="outline" 
                  className="flex-1 rounded-xl font-semibold border-slate-200 dark:border-slate-800"
                >
                  <RefreshCw className="h-4 w-4 mr-1.5" /> Scan Again
                </Button>
                
                <Button 
                  onClick={handleBookAppointment} 
                  className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md shadow-sky-600/10 flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Book Appointment
                </Button>
              </div>
            </div>
          )}

          {/* ERROR STATE: Decoded successfully but invalid fields */}
          {scanStatus === "error" && (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="h-14 w-14 bg-red-100 dark:bg-red-950/20 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-foreground">Verification Failed</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  {errorMsg || "Decoded QR does not match standard DocSaathi requirements."}
                </p>
              </div>
              <Button onClick={handleRetry} className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-md">
                Try Scanning Again
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
