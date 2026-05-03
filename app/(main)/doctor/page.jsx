import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getDoctorAppointments, getDoctorAvailability } from "@/actions/doctor";
import { AvailabilitySettings } from "./_components/availability-settings";
import { getCurrentUser } from "@/actions/onboarding";
import { redirect } from "next/navigation";
import { Calendar, Clock, DollarSign } from "lucide-react";
import DoctorAppointmentsList from "./_components/appointments-list";
import { getDoctorEarnings, getDoctorPayouts } from "@/actions/payout";
import { DoctorEarnings } from "./_components/doctor-earnings";
import { DoctorProfile } from "./_components/doctor-profile";
import { User as UserIcon } from "lucide-react"; // Renamed to avoid collision if any

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
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <Tabs
        defaultValue="earnings"
        className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6"
      >
        {/* Horizontal scrollable on mobile, vertical on md+ */}
        <TabsList className="md:col-span-1 bg-muted/30 border flex flex-row md:flex-col w-full p-1.5 rounded-xl md:h-auto h-12 overflow-x-auto overflow-y-hidden md:overflow-visible no-scrollbar gap-1">
          <TabsTrigger
            value="earnings"
            className="flex-shrink-0 md:flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-auto md:w-full px-3 text-sm whitespace-nowrap"
          >
            <DollarSign className="h-4 w-4 mr-1.5 md:mr-2 shrink-0" />
            <span>Earnings</span>
          </TabsTrigger>
          <TabsTrigger
            value="appointments"
            className="flex-shrink-0 md:flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-auto md:w-full px-3 text-sm whitespace-nowrap"
          >
            <Calendar className="h-4 w-4 mr-1.5 md:mr-2 shrink-0" />
            <span>Appointments</span>
          </TabsTrigger>
          <TabsTrigger
            value="availability"
            className="flex-shrink-0 md:flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-auto md:w-full px-3 text-sm whitespace-nowrap"
          >
            <Clock className="h-4 w-4 mr-1.5 md:mr-2 shrink-0" />
            <span>Availability</span>
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="flex-shrink-0 md:flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-auto md:w-full px-3 text-sm whitespace-nowrap"
          >
            <UserIcon className="h-4 w-4 mr-1.5 md:mr-2 shrink-0" />
            <span>My Profile</span>
          </TabsTrigger>
        </TabsList>
        <div className="md:col-span-3">
          <TabsContent value="appointments" className="border-none p-0 mt-0">
            <DoctorAppointmentsList
              appointments={appointmentsData.appointments || []}
            />
          </TabsContent>
          <TabsContent value="availability" className="border-none p-0 mt-0">
            <AvailabilitySettings slots={availabilityData.slots || []} />
          </TabsContent>
          <TabsContent value="earnings" className="border-none p-0 mt-0">
            <DoctorEarnings
              earnings={earningsData.earnings || {}}
              payouts={payoutsData.payouts || []}
            />
          </TabsContent>
          <TabsContent value="profile" className="border-none p-0 mt-0">
            <DoctorProfile user={user} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
