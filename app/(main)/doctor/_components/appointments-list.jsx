"use client";

import { useState, useEffect } from "react";
import { getDoctorAppointments } from "@/actions/doctor";
import { AppointmentCard } from "@/components/appointment-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, History, Clock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import useFetch from "@/hooks/use-fetch";

export default function DoctorAppointmentsList() {
  const {
    loading,
    data,
    fn: fetchAppointments,
  } = useFetch(getDoctorAppointments);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const appointments = data?.appointments || [];

  const upcomingAppointments = appointments.filter(
    (app) => app.status === "SCHEDULED"
  );
  
  const pastAppointments = appointments.filter(
    (app) => app.status !== "SCHEDULED"
  ).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="bg-muted/30 border p-1 rounded-xl mb-6">
          <TabsTrigger value="upcoming" className="px-6 py-2">
            <Clock className="h-4 w-4 mr-2" />
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="history" className="px-6 py-2">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-0">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-sky-500" />
                Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center gap-2 text-muted-foreground">
                    <div className="h-4 w-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    Loading appointments...
                  </div>
                </div>
              ) : upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      userRole="DOCTOR"
                      refetchAppointments={fetchAppointments}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-sky-50 dark:bg-sky-900/20 p-4 rounded-full inline-flex mb-4 border border-sky-100 dark:border-sky-800">
                    <Calendar className="h-10 w-10 text-sky-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No upcoming appointments
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    You don&apos;t have any scheduled appointments yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <History className="h-5 w-5 text-sky-500" />
                Appointment History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center gap-2 text-muted-foreground">
                    <div className="h-4 w-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    Loading history...
                  </div>
                </div>
              ) : pastAppointments.length > 0 ? (
                <div className="space-y-4">
                  {pastAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      userRole="DOCTOR"
                      refetchAppointments={fetchAppointments}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-full inline-flex mb-4 border border-slate-100 dark:border-slate-800">
                    <History className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No past appointments
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Your completed, cancelled, or rejected appointments will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
