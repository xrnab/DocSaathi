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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Appointments List (2 columns on lg) */}
        <div className="lg:col-span-2 space-y-6">
          <DoctorAppointmentsList
            appointments={appointmentsData.appointments || []}
          />
        </div>

        {/* Right Column Sidebar: Earnings, Availability & Profile (1 column, sticky) */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
          <DoctorEarnings
            earnings={earningsData.earnings || {}}
            payouts={payoutsData.payouts || []}
          />
          <AvailabilitySettings slots={availabilityData.slots || []} />
          <DoctorProfile user={user} />
        </div>
      </div>
    </div>
  );
}
