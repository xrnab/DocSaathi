import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getDoctorAppointments, getDoctorAvailability } from "@/actions/doctor";
import { AvailabilitySettings } from "./_components/availability-settings";
import { getCurrentUser } from "@/actions/onboarding";
import { redirect } from "next/navigation";
import { Calendar, Clock, DollarSign, User as UserIcon, ShieldCheck } from "lucide-react";
import DoctorAppointmentsList from "./_components/appointments-list";
import { getDoctorEarnings, getDoctorPayouts } from "@/actions/payout";
import { DoctorEarnings } from "./_components/doctor-earnings";
import { DoctorProfile } from "./_components/doctor-profile";

export default async function DoctorDashboardPage() {
  const user = await getCurrentUser();

  // Redirect if not a doctor
  if (user?.role !== "DOCTOR") {
    redirect("/onboarding");
  }

  // If already verified, redirect to dashboard
  if (user?.verificationStatus !== "VERIFIED") {
    redirect("/doctor/verification");
  }

  const [appointmentsData, availabilityData, earningsData, payoutsData] =
    await Promise.all([
      getDoctorAppointments(),
      getDoctorAvailability(),
      getDoctorEarnings(),
      getDoctorPayouts(),
    ]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl animate-in fade-in duration-300">
      
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 to-indigo-700 text-white p-8 md:p-10 shadow-lg border border-sky-400/20">
        <div className="absolute top-0 right-0 transform translate-x-20 -translate-y-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 transform -translate-x-20 translate-y-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-sky-200 fill-sky-200/20" /> Verified Medical Professional
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Welcome, Dr. {user.name}
            </h1>
            <p className="text-sky-100 max-w-xl text-sm md:text-base font-medium leading-relaxed">
              Manage your availability, view scheduled consultations, and review patient analytics for your specialty: <strong>{user.specialty || "General Medicine"}</strong>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 shrink-0 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15">
            <div>
              <p className="text-xs text-sky-200 uppercase font-bold tracking-wider">Experience</p>
              <p className="text-lg font-bold text-white">{user.experience || 0} Years</p>
            </div>
            <div>
              <p className="text-xs text-sky-200 uppercase font-bold tracking-wider">Specialty</p>
              <p className="text-lg font-bold text-white leading-tight truncate max-w-[150px]" title={user.specialty}>
                {user.specialty || "General Medicine"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="schedule" className="w-full space-y-6">
        <TabsList className="bg-muted/30 border p-1 rounded-2xl flex flex-wrap gap-2 w-fit">
          <TabsTrigger value="schedule" className="px-6 py-2.5 rounded-xl font-bold text-sm">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule & Appointments
          </TabsTrigger>
          <TabsTrigger value="profile" className="px-6 py-2.5 rounded-xl font-bold text-sm">
            <UserIcon className="h-4 w-4 mr-2" />
            Edit Profile
          </TabsTrigger>
          <TabsTrigger value="earnings" className="px-6 py-2.5 rounded-xl font-bold text-sm">
            <DollarSign className="h-4 w-4 mr-2" />
            Financials & Earnings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-0 focus-visible:ring-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column: Appointments List */}
            <div className="lg:col-span-2 space-y-6">
              <DoctorAppointmentsList
                appointments={appointmentsData.appointments || []}
              />
            </div>

            {/* Right Column: Availability Settings & Summary Card */}
            <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
              <AvailabilitySettings slots={availabilityData.slots || []} />
              
              {/* Earnings Quick Summary Card */}
              <div className="bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-850 p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-sky-500/10 rounded-2xl text-sky-600 dark:text-sky-400">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Earnings Overview</h4>
                    <p className="text-xs text-muted-foreground">Quick summary of credits earned</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-sky-100 dark:border-sky-900/40 pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Earned</p>
                    <p className="text-2xl font-black text-foreground">{earningsData.earnings?.totalEarned || 0} Cr</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Balance</p>
                    <p className="text-2xl font-black text-sky-600 dark:text-sky-400">{user.credits || 0} Cr</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="profile" className="mt-0 focus-visible:ring-0">
          <div className="max-w-4xl mx-auto">
            <DoctorProfile user={user} />
          </div>
        </TabsContent>

        <TabsContent value="earnings" className="mt-0 focus-visible:ring-0">
          <DoctorEarnings
            earnings={earningsData.earnings || {}}
            payouts={payoutsData.payouts || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
