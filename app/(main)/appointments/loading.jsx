import AppointmentCardSkeleton from "@/components/skeletons/appointment-card-skeleton";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export default function AppointmentsLoading() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <PageHeader
        icon={<Calendar />}
        title="My Appointments"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-sky-400 animate-pulse" />
                Your Scheduled Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {[1, 2, 3].map((i) => (
                  <AppointmentCardSkeleton key={i} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
