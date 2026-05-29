import { User, Activity, Droplet, Calendar, FileText, Pill, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getPatientRecords } from "@/actions/records";
import { OfflineBadge } from "@/components/offline-badge";
import { format } from "date-fns";
import PunjabiVoiceReader from "@/components/punjabi-voice-reader";
import CollapsiblePrescriptionOCR from "@/components/collapsible-prescription-ocr";
import PrescriptionStats from "@/components/prescription-stats";
import HealthTimeline from "@/components/health-timeline-wrapper";



export default async function PatientRecordScreen({ searchParams }) {
  const params = await searchParams;
  const result = await getPatientRecords(params.patientId);

  if (result.error) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-20 px-4 sm:px-0">
        <PageHeader title="Patient Health Record" backLink="/" backLabel="Home" />
        <Card className="border-red-200 bg-red-50 p-8 text-center text-red-800">
          <CardTitle>Authentication Required</CardTitle>
          <p className="mt-2">Please sign in as a patient to view your health records.</p>
        </Card>
      </div>
    );
  }

  const patient = result.data;
  const visits = patient.patientAppointments || [];
  const prescriptions = patient.prescriptions || [];
  const vaccinations = patient.vaccinations || [];

  // Calculate age: prefer explicit 'age' field, then fallback to dateOfBirth calculation
  let age = patient.age || "Unknown";
  if (patient.dateOfBirth && (!patient.age || patient.age === "Unknown")) {
    const diff = new Date() - new Date(patient.dateOfBirth);
    age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader title="Patient Health Record" backLink="/" backLabel="Home" />
        <OfflineBadge />
      </div>

      {/* Upload & Scan Prescription Drawer */}
      <CollapsiblePrescriptionOCR patientId={patient.id} />

      {/* Patient Profile Header Card */}
      <Card className="border-sky-200 dark:border-sky-800 bg-card shadow-md rounded-2xl sm:rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1.5 sm:w-2 h-full bg-sky-500"></div>
        <CardContent className="p-4 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:items-center">
            <Avatar className="h-16 w-16 sm:h-24 sm:w-24 border-2 sm:border-4 border-sky-100 dark:border-sky-900 shadow-sm mx-auto md:mx-0">
              {patient.imageUrl && <AvatarImage src={patient.imageUrl} alt={patient.name} />}
              <AvatarFallback className="bg-gradient-to-br from-sky-400 to-blue-600 text-white text-xl sm:text-2xl font-bold">
                {patient.name ? patient.name.split(' ').map(n => n[0]).join('').substring(0, 2) : "PT"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3 text-center md:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-xl sm:text-3xl font-bold text-foreground tracking-tight">{patient.name || "Patient"}</h2>
                <Badge variant="outline" className="w-fit mx-auto sm:mx-0 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800 bg-sky-50/30 text-[10px]">
                  ID: {patient.id.split('-')[0].toUpperCase()}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 text-[11px] sm:text-sm">
                <div className="flex items-center gap-1.5 bg-muted/40 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-border/50">
                  <User className="h-3.5 w-3.5 text-sky-500" />
                  <span className="text-muted-foreground hidden xs:inline">Age:</span>
                  <span className="font-bold text-foreground">{age}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-muted/40 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-border/50">
                  <Activity className="h-3.5 w-3.5 text-sky-500" />
                  <span className="text-muted-foreground hidden xs:inline">Sex:</span>
                  <span className="font-bold text-foreground capitalize truncate">{patient.gender || "—"}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/10 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                  <Droplet className="h-3.5 w-3.5" />
                  <span className="font-bold">{patient.bloodType || "—"}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-muted/40 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-border/50">
                   <span className="text-muted-foreground">H:</span>
                   <span className="font-bold text-foreground">{patient.height ? `${patient.height}cm` : "—"}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-muted/40 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-border/50">
                   <span className="text-muted-foreground">W:</span>
                   <span className="font-bold text-foreground">{patient.weight ? `${patient.weight}kg` : "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Profile Sections (Summary) */}
      {(patient.medicalHistory || patient.allergies || patient.medications) && (
        <Card className="border-sky-100 dark:border-sky-900/50 shadow-sm rounded-xl sm:rounded-2xl">
          <CardContent className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">History</h4>
              <p className="text-sm text-foreground line-clamp-3">{patient.medicalHistory || "None"}</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-500/80">Allergies</h4>
              <p className="text-sm text-foreground line-clamp-3">{patient.allergies || "None"}</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-600/80">Meds</h4>
              <p className="text-sm text-foreground line-clamp-3">{patient.medications || "None"}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Prescriptions and Vaccinations */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Current Prescriptions */}
          <Card className="border-sky-100 dark:border-sky-900 shadow-sm rounded-xl sm:rounded-2xl h-fit">
            <CardHeader className="bg-sky-50/50 dark:bg-sky-900/10 border-b border-sky-100 dark:border-sky-900 pb-3 sm:pb-4 py-3 sm:py-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Pill className="h-4 w-4 sm:h-5 w-5 text-sky-500" />
                Prescriptions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {prescriptions.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No records.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {prescriptions.filter(p => p.active).map(med => (
                    <div key={med.id} className="p-4 hover:bg-muted/30 transition-colors space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                        <h4 className="font-bold text-foreground break-words w-full sm:w-auto">
                          {med.name}
                        </h4>
                        <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full self-start sm:self-auto shrink-0">
                          {med.duration}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-xl border border-border/40">
                        <div>
                          <p className="text-sm text-sky-600 dark:text-sky-400 font-extrabold">{med.dosage}</p>
                          <p className="text-xs text-muted-foreground font-semibold mt-0.5">{med.frequency}</p>
                        </div>
                        <div className="shrink-0">
                          <PunjabiVoiceReader prescription={med} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prescription Stats */}
          <PrescriptionStats prescriptions={prescriptions} />

          {/* Health Timeline */}
          <HealthTimeline visits={visits} />

          {/* Vaccination History */}
          <Card className="border-sky-100 dark:border-sky-900 shadow-sm rounded-xl sm:rounded-2xl h-fit">
            <CardHeader className="bg-sky-50/50 dark:bg-sky-900/10 border-b border-sky-100 dark:border-sky-900 pb-3 sm:pb-4 py-3 sm:py-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <ShieldCheck className="h-4 w-4 sm:h-5 w-5 text-sky-500" />
                Vaccinations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {vaccinations.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No history.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {vaccinations.map(vax => (
                    <div key={vax.id} className="p-3 sm:p-4">
                      <h4 className="font-medium text-sm text-foreground">{vax.name}</h4>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {format(new Date(vax.date), "MMM d, yy")}
                        </p>
                        <span className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[100px]">{vax.provider}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Past Visits */}
        <div className="lg:col-span-2">
          <Card className="border-sky-100 dark:border-sky-900 shadow-sm rounded-xl sm:rounded-2xl h-full overflow-hidden">
            <CardHeader className="bg-sky-50/50 dark:bg-sky-900/10 border-b border-sky-100 dark:border-sky-900 pb-3 sm:pb-4 py-3 sm:py-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Activity className="h-4 w-4 sm:h-5 w-5 text-sky-500" />
                Clinical Visits
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 lg:p-8">
              {visits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-sky-50 dark:bg-sky-900/20 rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-sky-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">No visits found</h3>
                </div>
              ) : (
                <div className="space-y-6 sm:space-y-8 relative before:absolute before:inset-0 before:ml-4 sm:before:ml-5 md:before:mx-auto before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-sky-200 dark:before:via-sky-800 before:to-transparent">
                  {visits.map((visit) => (
                    <div key={visit.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                      {/* Icon */}
                      <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 sm:border-4 border-background bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                        <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </div>
                      {/* Card */}
                      <div className="w-[calc(100%-3rem)] sm:w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 sm:p-4 rounded-xl border border-border bg-card shadow-sm hover:border-sky-300 dark:hover:border-sky-700 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] sm:text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-1.5 py-0.5 rounded-md">
                            {format(new Date(visit.startTime), "MMM d, yy")}
                          </span>
                          <Badge variant={visit.status === "COMPLETED" ? "default" : "secondary"} className="text-[8px] sm:text-[9px]">
                            {visit.status}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-foreground text-sm sm:text-base mb-1 truncate">{visit.patientDescription || "Consultation"}</h4>
                        <p className="text-xs sm:text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                          <User className="h-3 w-3 text-muted-foreground" /> {visit.doctor?.name || "Doctor"}
                        </p>
                        <Separator className="my-2" />
                        <p className="text-[11px] sm:text-sm text-muted-foreground leading-relaxed line-clamp-3 sm:line-clamp-none">
                          {visit.notes || "No notes yet."}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
