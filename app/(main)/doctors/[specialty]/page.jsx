import { redirect } from "next/navigation";
import { getDoctorsBySpecialty } from "@/actions/doctors-listing";
import { DoctorCard } from "../components/doctor-card";
import { PageHeader } from "@/components/page-header";
import { LanguageFilter } from "@/components/language-filter";

export default async function DoctorSpecialtyPage({ params, searchParams }) {
  const { specialty } = await params;
  const { lang } = await searchParams || {};

  // Redirect to main doctors page if no specialty is provided
  if (!specialty) {
    redirect("/doctors");
  }

  // Fetch doctors by specialty
  const { doctors, error } = await getDoctorsBySpecialty(specialty, lang);

  if (error) {
    console.error("Error fetching doctors:", error);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title={specialty.split("%20").join(" ")}
          backLink="/doctors"
          backLabel="All Specialties"
        />
        <LanguageFilter />
      </div>

      {doctors && doctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-4 bg-muted/20 rounded-2xl border border-dashed border-sky-200 dark:border-sky-900/30">
          <h3 className="text-2xl font-semibold text-foreground mb-3">
            No doctors available
          </h3>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            There are currently no verified doctors in this specialty. Please
            check back later or choose another specialty.
          </p>
        </div>
      )}
    </div>
  );
}
