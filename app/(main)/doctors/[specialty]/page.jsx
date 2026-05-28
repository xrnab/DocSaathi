import { redirect } from "next/navigation";
import { getDoctorsBySpecialty } from "@/actions/doctors-listing";
import { DoctorCard } from "../components/doctor-card";
import { PageHeader } from "@/components/page-header";
import { LanguageFilter } from "@/components/language-filter";
import { NabhaFilter } from "@/components/nabha-filter";
import { FilteredDoctorList } from "../components/filtered-doctor-list";

export default async function DoctorSpecialtyPage({ params, searchParams }) {
  const { specialty } = await params;
  const { lang, nabha } = await searchParams || {};

  // Redirect to main doctors page if no specialty is provided
  if (!specialty) {
    redirect("/doctors");
  }

  // Fetch doctors by specialty
  const { doctors, error } = await getDoctorsBySpecialty(specialty, lang);

  if (error) {
    console.error("Error fetching doctors:", error);
  }

  // Filter doctors available in Nabha (simulated using deterministic logic)
  const displayedDoctors = (() => {
    if (!doctors) return [];
    if (nabha === "true") {
      // Filter to show only doctors with even experience (simulating Nabha nearby / local community practitioners)
      return doctors.filter(d => d.experience % 2 === 0);
    }
    return doctors;
  })();

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title={specialty.split("%20").join(" ")}
          backLink="/doctors"
          backLabel="All Specialties"
        />
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <NabhaFilter />
          <LanguageFilter />
        </div>
      </div>

      {displayedDoctors && displayedDoctors.length > 0 ? (
        <FilteredDoctorList initialDoctors={displayedDoctors} specialty={specialty} />
      ) : (
        <div className="text-center py-20 px-4 bg-muted/20 rounded-2xl border border-dashed border-sky-200 dark:border-sky-900/30">
          <h3 className="text-2xl font-semibold text-foreground mb-3">
            No doctors available
          </h3>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            There are currently no verified doctors in this specialty. Please
            check back later or choose another specialty.
          </p>
          {(() => {
            const getRelatedSpecialties = (spec) => {
              const s = String(spec || "").toLowerCase();
              if (s.includes("general") || s.includes("medicine")) {
                return ["AYUSH (Ayurveda & Homeopathy)", "Pediatrics", "Cardiology"];
              }
              if (s.includes("cardio")) {
                return ["General Physician", "General Medicine", "Neurology"];
              }
              if (s.includes("pediatr")) {
                return ["General Physician", "General Medicine", "Obstetrics & Gynecology"];
              }
              if (s.includes("gastro") || s.includes("endo")) {
                return ["General Physician", "General Medicine", "Cardiology"];
              }
              if (s.includes("neuro") || s.includes("psych")) {
                return ["General Physician", "Neurology", "Psychiatry"];
              }
              if (s.includes("ortho") || s.includes("bone")) {
                return ["General Physician", "General Medicine", "AYUSH (Ayurveda & Homeopathy)"];
              }
              if (s.includes("eye") || s.includes("ophthal")) {
                return ["General Physician", "General Medicine"];
              }
              return ["General Physician", "Cardiology", "Pediatrics"];
            };
            const related = getRelatedSpecialties(specialty);
            return (
              <div className="mt-8 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Try a related specialty:</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {related.map((r) => (
                    <Link
                      key={r}
                      href={`/doctors/${r}`}
                      className="px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 hover:border-sky-500/40 rounded-xl text-xs font-semibold text-sky-600 dark:text-sky-400 transition-all hover:scale-105 active:scale-95"
                    >
                      {r}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
