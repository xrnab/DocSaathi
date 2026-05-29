import { getActiveEmergencies } from "@/actions/emergency";
import { EmergencyClient } from "./_components/emergency-client";
import { PageHeader } from "@/components/page-header";
import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "Live Emergency SOS Dispatch - DocSaathi",
  description: "Monitor and respond to patient emergency requests in real time",
};

export default async function AdminEmergencyPage() {
  const { emergencies } = await getActiveEmergencies().catch(() => ({ emergencies: [] }));

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-5xl">
      <PageHeader
        icon={<AlertCircle className="text-red-500" />}
        title="Live Emergency SOS Board"
        backLink="/admin"
        backLabel="Back to Admin"
      />
      <EmergencyClient initialEmergencies={emergencies} />
    </div>
  );
}
