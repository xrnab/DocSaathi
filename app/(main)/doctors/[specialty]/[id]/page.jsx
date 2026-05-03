import { getDoctorById, getAvailableTimeSlots } from "@/actions/appointments";
import { getCurrentUser } from "@/actions/onboarding";
import { DoctorProfile } from "./_components/doctor-profile";
import { redirect } from "next/navigation";

export default async function DoctorProfilePage({ params }) {
  const { id } = await params;

  try {
    const doctorData = await getDoctorById(id);
    let availableDays = [];

    try {
      const slotsData = await getAvailableTimeSlots(id);
      availableDays = slotsData.days || [];
    } catch (error) {
      console.error("Error loading doctor availability:", error);
    }

    return (
      <DoctorProfile
        doctor={doctorData.doctor}
        availableDays={availableDays}
        viewer={await getCurrentUser()}
      />
    );
  } catch (error) {
    console.error("Error loading doctor profile:", error);
    redirect("/doctors");
  }
}
