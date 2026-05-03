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

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        icon={<Calendar />}
        title="My Appointments"
        backLink={user.role === "ADMIN" ? "/admin" : "/doctors"}
        backLabel={user.role === "ADMIN" ? "Back to Admin" : "Find Doctors"}
      />

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
            <div className="space-y-4">
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
              <Link href="/doctors">
                <Button className="bg-gradient-to-r from-blue-600 to-sky-500 text-white hover:from-blue-700 hover:to-sky-600 shadow-lg shadow-sky-500/20 px-8 py-6 rounded-full text-lg">
                  Book an Appointment
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
