import { getCurrentUser } from "@/actions/onboarding";
import { redirect } from "next/navigation";
import OnboardingForm from "./_components/onboarding-form";
import { Activity } from "lucide-react";

export default async function PatientOnboarding() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Ensure only patients can access this
  if (user.role !== "PATIENT" && user.role !== "UNASSIGNED") {
    redirect("/");
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="bg-sky-100 dark:bg-sky-900/30 p-4 rounded-full mb-4">
          <Activity className="h-10 w-10 text-sky-500" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Medical Onboarding</h1>
        <p className="text-muted-foreground mt-2 max-w-lg">
          Please provide your medical details to help our doctors provide the best possible care for you.
        </p>
      </div>

      <OnboardingForm user={user} />
    </div>
  );
}
