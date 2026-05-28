import { getPatientAppointments } from "@/actions/patient";
import { AppointmentCard } from "@/components/appointment-card";
import { PageHeader } from "@/components/page-header";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/onboarding";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function PatientAppointmentsPage() {
  const user = await getCurrentUser();

  if (!user || !["PATIENT", "ADMIN"].includes(user.role)) {
    redirect("/onboarding");
  }

  const { appointments, error } = await getPatientAppointments();

  const nextAppointment = appointments
    ?.filter(a => a.status === "SCHEDULED" && new Date(a.endTime) > new Date())
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <PageHeader
        icon={<Calendar />}
        title="My Appointments"
        backLink={user.role === "ADMIN" ? "/admin" : "/doctors"}
        backLabel={user.role === "ADMIN" ? "Back to Admin" : "Find Doctors"}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className={appointments?.length > 0 ? "lg:col-span-3" : "lg:col-span-4"}>
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-sky-400" />
                Your Scheduled Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="text-center py-8">
                  <p className="text-red-400">Error: {error}</p>
                </div>
              ) : appointments?.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {appointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      userRole="PATIENT"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-sky-500/10 p-4 rounded-full inline-flex mb-4">
                    <Calendar className="h-10 w-10 text-sky-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    No appointments scheduled
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-8">
                    You don&apos;t have any appointments scheduled yet. Browse our
                    verified doctors and book your first video consultation.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
                    <Link href="/doctors">
                      <Button className="bg-gradient-to-r from-blue-600 to-sky-500 text-white hover:from-blue-700 hover:to-sky-600 shadow-lg shadow-sky-500/20 px-8 py-6 rounded-full text-lg w-full sm:w-auto">
                        Book an Appointment
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Link href="/doctors" className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 text-xs font-bold uppercase tracking-wider rounded-full border border-border transition-colors">
                      Browse Doctors
                    </Link>
                    <Link href="/#symptom-checker" className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 text-xs font-bold uppercase tracking-wider rounded-full border border-border transition-colors">
                      Check Symptom Checker
                    </Link>
                    <a href="tel:108" className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider rounded-full transition-colors">
                      📞 Call 108 Emergency
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {appointments?.length > 0 && (
          <div className="hidden lg:block lg:col-span-1 sticky top-24">
            <Card className="border-sky-200 dark:border-sky-900 bg-sky-500/5 backdrop-blur-sm rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest leading-none">
                  Next Appointment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {nextAppointment ? (
                  <>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-foreground text-sm truncate">{nextAppointment.doctor.name}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 capitalize truncate">
                        {nextAppointment.doctor.specialty}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-slate-200/30 dark:border-slate-800/30">
                      <p className="font-bold text-foreground flex items-center gap-1">
                        📅 {new Date(nextAppointment.startTime).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="font-medium flex items-center gap-1">
                        ⏰ {new Date(nextAppointment.startTime).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Link href={`/video-call?appointmentId=${nextAppointment.id}&from=appointments`} className="block">
                      <Button className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/10">
                        Join Call Now
                      </Button>
                    </Link>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No upcoming consultations scheduled
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
