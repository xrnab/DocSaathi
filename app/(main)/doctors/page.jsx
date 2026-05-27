import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { SPECIALTIES } from "@/lib/specialities";

export default async function DoctorsPage() {
  return (
    <div className="space-y-8 sm:space-y-12 py-4 sm:py-8">
      {/* Premium Header */}
      <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-3 sm:space-y-4 px-4">
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          <div className="inline-flex items-center px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 text-xs sm:text-sm font-medium text-sky-600 dark:text-sky-400">
            Our Specialists
          </div>
          <div className="inline-flex items-center px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400 gap-1 sm:gap-1.5 shadow-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
            </span>
            District: Nabha
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
          Find Your <span className="gradient-title">Doctor</span>
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
          Browse by specialty or view all available healthcare providers
          ready to help you today.
        </p>
      </div>

      {/* Specialty Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 px-4">
        {SPECIALTIES.map((specialty, index) => (
          <Link
            key={specialty.name}
            href={`/doctors/${specialty.name}`}
            className={`animate-in fade-in slide-in-from-bottom-4 duration-1000`}
            style={{ animationDelay: `${index * 50 + 300}ms` }}
          >
            <Card className="bg-card/50 backdrop-blur-md border-sky-200 dark:border-sky-900/20 hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500/10 hover:-translate-y-1 transition-all duration-300 h-full">
              <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center text-center h-full">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center mb-4 sm:mb-6 shadow-sm border border-sky-100 dark:border-sky-800/30">
                  <div className="text-sky-500 dark:text-sky-400 scale-100 sm:scale-125">
                    {specialty.icon}
                  </div>
                </div>
                <h3 className="font-semibold text-foreground text-base sm:text-lg">
                  {specialty.name}
                </h3>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
