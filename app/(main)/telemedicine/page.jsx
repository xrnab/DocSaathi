import { getDoctorQueue } from "@/actions/telemedicine";
import TelemedicineDashboardClient from "./client-dashboard";
import { PageHeader } from "@/components/page-header";
import { Card, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Telemedicine Command Center | DocSaathi",
};

export default async function TelemedicinePage() {
  const result = await getDoctorQueue();

  if (result.error) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4 sm:px-0">
        <PageHeader title="Telemedicine Dashboard" backLink="/" backLabel="Home" />
        <Card className="border-red-200 bg-red-50 p-8 text-center text-red-800">
          <CardTitle>Access Denied</CardTitle>
          <p className="mt-2">{result.error}</p>
        </Card>
      </div>
    );
  }

  return <TelemedicineDashboardClient initialAppointments={result.data || []} />;
}
