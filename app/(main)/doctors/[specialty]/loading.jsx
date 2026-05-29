import DoctorCardSkeleton from "@/components/skeletons/doctor-card-skeleton";
import { PageHeader } from "@/components/page-header";

export default function DoctorSpecialtyLoading() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Loading Specialists..."
          backLink="/doctors"
          backLabel="All Specialties"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <DoctorCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
