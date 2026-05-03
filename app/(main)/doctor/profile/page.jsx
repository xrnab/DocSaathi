import { getCurrentUser } from "@/actions/onboarding";
import { redirect } from "next/navigation";
import { DoctorProfile } from "../_components/doctor-profile";
import { PageHeader } from "@/components/page-header";

export default async function DoctorProfilePage() {
  const user = await getCurrentUser();

  if (user?.role !== "DOCTOR") {
    redirect("/onboarding");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4 sm:px-0">
      <PageHeader 
        title="My Professional Profile" 
        backLink="/doctor" 
        backLabel="Dashboard" 
      />
      
      <DoctorProfile user={user} />
    </div>
  );
}
