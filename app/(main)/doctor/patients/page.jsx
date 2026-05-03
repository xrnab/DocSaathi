import { getDoctorPatients } from "@/actions/records";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Activity, Clock, FileText, Droplet } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatName } from "@/lib/utils";
import { getCurrentUser } from "@/actions/onboarding";

export default async function DoctorPatientsScreen() {
  const result = await getDoctorPatients();

  if (result.error) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4 sm:px-0">
        <PageHeader title="Patient Directory" backLink="/" backLabel="Home" />
        <Card className="border-red-200 bg-red-50 p-8 text-center text-red-800">
          <CardTitle>Access Denied</CardTitle>
          <p className="mt-2">You don't have permission to view the patient directory.</p>
        </Card>
      </div>
    );
  }

  const patients = result.data || [];
  const user = await getCurrentUser();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-4 sm:px-0">
      <PageHeader 
        title="Patient Directory" 
        backLink={user?.role === "ADMIN" || user?.role === "OWNER" ? "/admin" : "/doctor"} 
        backLabel={user?.role === "ADMIN" || user?.role === "OWNER" ? "Admin Dashboard" : "Doctor Dashboard"} 
      />

      {patients.length === 0 ? (
        <Card className="border-sky-200 dark:border-sky-800 bg-card shadow-sm rounded-3xl">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-sky-50 dark:bg-sky-900/20 rounded-full flex items-center justify-center mb-6">
              <User className="h-10 w-10 text-sky-400" />
            </div>
            <h3 className="text-xl font-bold text-foreground">No Patients Yet</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
              You haven't completed any consultations yet. Once you consult with patients, their profiles will appear here for easy access.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((patient) => (
            <Card key={patient.id} className="border-sky-100 dark:border-sky-900 hover:border-sky-300 dark:hover:border-sky-700 transition-colors shadow-sm rounded-2xl overflow-hidden group">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-16 w-16 border-2 border-sky-100 dark:border-sky-900 shadow-sm">
                      {patient.imageUrl && <AvatarImage src={patient.imageUrl} alt={patient.name} />}
                      <AvatarFallback className="bg-sky-100 text-sky-700 font-bold text-xl">
                        {patient.name ? patient.name.split(' ').map(n => n[0]).join('').substring(0, 2) : "PT"}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-foreground truncate">{formatName(patient.name) || "Patient"}</h3>
                      <p className="text-sm text-muted-foreground truncate">{patient.email}</p>
                      <Badge variant="outline" className="mt-2 text-xs border-sky-200 text-sky-600 dark:border-sky-800 dark:text-sky-400">
                        ID: {patient.id.split('-')[0].toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2 text-slate-400" />
                      Last Visit: <span className="font-medium text-foreground ml-1">{format(new Date(patient.lastVisit), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Activity className="h-4 w-4 mr-2 text-slate-400" />
                      Total Consultations: <span className="font-medium text-foreground ml-1">{patient.totalVisits}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Droplet className="h-4 w-4 mr-2 text-red-400" />
                      Blood Type: <span className="font-medium text-foreground ml-1">{patient.bloodType || "N/A"}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="h-4 w-4 mr-2 text-sky-400" />
                      Gender: <span className="font-medium text-foreground ml-1">{patient.gender || "N/A"}</span>
                    </div>
                  </div>

                  <Button asChild className="w-full bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50 shadow-none border border-sky-200 dark:border-sky-800">
                    <Link href={`/records?patientId=${patient.id}`}>
                      <FileText className="h-4 w-4 mr-2" /> View Full Records
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
