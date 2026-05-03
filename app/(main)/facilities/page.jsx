import { FacilityFinder } from "@/components/facility-finder";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Hospital, MapPin, Navigation, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function FacilitiesPage() {
  return (
    <div className="container mx-auto px-4 py-10 space-y-8 max-w-4xl">
      <PageHeader 
        title="Find Medical Facilities" 
        subtitle="Locate nearest hospitals, clinics, and emergency centers based on your current location."
        backLink="/"
        backLabel="Home"
      />

      <Card className="border-none bg-sky-50 dark:bg-slate-900/50 shadow-xl shadow-sky-500/5 rounded-[3rem] overflow-hidden mb-12">
        <CardContent className="p-10 sm:p-16 relative overflow-hidden">
          {/* Soft background accents */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-200/40 dark:bg-sky-500/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
            <div className="space-y-8 text-center lg:text-left flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500/10 rounded-full border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-bold uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" /> Emergency Assistance
              </div>
              <h2 className="text-5xl sm:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Find Help <br />
                <span className="text-sky-600">Near You</span>
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-xl max-w-md font-medium leading-relaxed">
                Locate verified hospitals, clinics, and emergency centers instantly with our real-time locator.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                  <Badge variant="secondary" className="bg-white dark:bg-slate-800">24/7 Access</Badge>
                  <Badge variant="secondary" className="bg-white dark:bg-slate-800">Verified Institutions</Badge>
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-[480px]">
              <Card className="bg-white dark:bg-slate-950 p-8 rounded-[2.5rem] border-none shadow-2xl shadow-sky-900/10">
                <FacilityFinder />
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border bg-muted/30 rounded-2xl">
            <CardContent className="p-6 flex gap-4 items-start">
              <Info className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground">How it works:</p>
                <p>We use your device's GPS to identify medical facilities within a 5km radius. If GPS is unavailable, we attempt to use your last known location.</p>
                <p>You can click the navigation icon on any result to get instant turn-by-turn directions via Google Maps.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-sky-100 dark:border-sky-900 rounded-3xl overflow-hidden h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Hospital className="h-5 w-5 text-red-500" />
                Facility Types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge className="bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold">Hospitals</Badge>
                <p className="text-xs text-muted-foreground">Full-service medical institutions providing 24/7 emergency care and specialized treatments.</p>
              </div>
              <div className="space-y-2">
                <Badge className="bg-sky-500/10 text-sky-600 border-sky-200 hover:bg-sky-500/20 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold">Clinics</Badge>
                <p className="text-xs text-muted-foreground">Local medical centers for routine checkups, minor procedures, and outpatient services.</p>
              </div>
              <div className="space-y-2">
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold">Doctors</Badge>
                <p className="text-xs text-muted-foreground">Private practices and individual healthcare provider offices in your immediate vicinity.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
