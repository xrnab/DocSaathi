import { User, Activity, Droplet, Calendar, FileText, Pill, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getPatientRecords } from "@/actions/records";
import { OfflineBadge } from "@/components/offline-badge";
import { format } from "date-fns";

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

      {/* Patient Profile Header Card */}
      <Card className="border-sky-200 dark:border-sky-800 bg-card shadow-md rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-2 h-full bg-sky-500"></div>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row gap-6 md:items-center">
            <Avatar className="h-24 w-24 border-4 border-sky-100 dark:border-sky-900 shadow-sm">
              {patient.imageUrl && <AvatarImage src={patient.imageUrl} alt={patient.name} />}
              <AvatarFallback className="bg-gradient-to-br from-sky-400 to-blue-600 text-white text-2xl font-bold">
                {patient.name ? patient.name.split(' ').map(n => n[0]).join('').substring(0, 2) : "PT"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-3xl font-bold text-foreground tracking-tight">{patient.name || "Patient"}</h2>
                <Badge variant="outline" className="w-fit text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800 bg-sky-50/30">
                  ID: {patient.id.split('-')[0].toUpperCase()}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center gap-1.5 bg-muted/40 px-3 py-2 rounded-xl border border-border/50">
                  <User className="h-4 w-4 text-sky-500" />
                  <span className="text-muted-foreground">Age:</span>
                  <span className="font-bold text-foreground">{age}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-muted/40 px-3 py-2 rounded-xl border border-border/50">
                  <Activity className="h-4 w-4 text-sky-500" />
                  <span className="text-muted-foreground">Gender:</span>
                  <span className="font-bold text-foreground capitalize">{patient.gender || "—"}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/10 px-3 py-2 rounded-xl text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                  <Droplet className="h-4 w-4" />
                  <span className="text-red-600/70 dark:text-red-400/70">Blood:</span>
                  <span className="font-bold">{patient.bloodType || "—"}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-muted/40 px-3 py-2 rounded-xl border border-border/50">
                  <div className="flex items-center gap-1">
                    <span className="text-sky-500 font-bold">↑</span>
                    <span className="text-muted-foreground">H:</span>
                    <span className="font-bold text-foreground">{patient.height ? `${patient.height} cm` : "—"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-muted/40 px-3 py-2 rounded-xl border border-border/50">
                  <div className="flex items-center gap-1">
                    <span className="text-sky-500 font-bold">⚖</span>
                    <span className="text-muted-foreground">W:</span>
                    <span className="font-bold text-foreground">{patient.weight ? `${patient.weight} kg` : "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Profile Sections (Summary) */}
      {(patient.medicalHistory || patient.allergies || patient.medications) && (
        <Card className="border-sky-100 dark:border-sky-900/50 shadow-sm rounded-2xl">
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Medical History</h4>
              <p className="text-sm text-foreground line-clamp-3">{patient.medicalHistory || "None recorded"}</p>
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-500/80">Allergies</h4>
              <p className="text-sm text-foreground line-clamp-3">{patient.allergies || "None known"}</p>
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600/80">Current Medications</h4>
              <p className="text-sm text-foreground line-clamp-3">{patient.medications || "None"}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Prescriptions and Vaccinations */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Current Prescriptions */}
          <Card className="border-sky-100 dark:border-sky-900 shadow-sm rounded-2xl h-fit">
            <CardHeader className="bg-sky-50/50 dark:bg-sky-900/10 border-b border-sky-100 dark:border-sky-900 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Pill className="h-5 w-5 text-sky-500" />
                Active Prescriptions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {prescriptions.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No active prescriptions recorded.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {prescriptions.filter(p => p.active).map(med => (
                    <div key={med.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <h4 className="font-semibold text-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                        <span className="break-words w-full sm:w-auto">{med.name}</span>
                        <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full self-start sm:self-auto shrink-0">{med.duration}</span>
                      </h4>
                      <p className="text-sm text-sky-600 dark:text-sky-400 font-medium mt-1">{med.dosage} • {med.frequency}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vaccination History */}
          <Card className="border-sky-100 dark:border-sky-900 shadow-sm rounded-2xl h-fit">
            <CardHeader className="bg-sky-50/50 dark:bg-sky-900/10 border-b border-sky-100 dark:border-sky-900 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-sky-500" />
                Vaccinations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {vaccinations.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  No vaccination history recorded.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {vaccinations.map(vax => (
                    <div key={vax.id} className="p-4">
                      <h4 className="font-medium text-foreground">{vax.name}</h4>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {format(new Date(vax.date), "MMM d, yyyy")}
                        </p>
                        <span className="text-xs text-muted-foreground">{vax.provider}</span>
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
          <Card className="border-sky-100 dark:border-sky-900 shadow-sm rounded-2xl h-full">
            <CardHeader className="bg-sky-50/50 dark:bg-sky-900/10 border-b border-sky-100 dark:border-sky-900 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-sky-500" />
                Clinical History & Visits
              </CardTitle>
              <CardDescription>Chronological record of your consultations</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {visits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-sky-50 dark:bg-sky-900/20 rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-sky-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">No visits found</h3>
                  <p className="text-muted-foreground mt-1 max-w-sm">
                    You haven't had any consultations yet. Your appointment history will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-sky-200 dark:before:via-sky-800 before:to-transparent">
                  {visits.map((visit) => (
                    <div key={visit.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      {/* Icon */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                        <FileText className="h-4 w-4" />
                      </div>
                      {/* Card */}
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-card shadow-sm hover:border-sky-300 dark:hover:border-sky-700 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2 py-1 rounded-md">
                            {format(new Date(visit.startTime), "MMM d, yyyy h:mm a")}
                          </span>
                          <Badge variant={visit.status === "COMPLETED" ? "default" : "secondary"} className="text-[10px]">
                            {visit.status}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-foreground text-base mb-1">{visit.patientDescription || "General Consultation"}</h4>
                        <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" /> {visit.doctor?.name || "Doctor"}
                        </p>
                        <Separator className="my-2" />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {visit.notes || "No clinical notes provided yet."}
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
