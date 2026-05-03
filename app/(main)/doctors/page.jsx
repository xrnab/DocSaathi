import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { SPECIALTIES } from "@/lib/specialities";

export default async function DoctorsPage() {
  return (
    <div className="space-y-12 py-8">
      {/* Premium Header */}
      <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 text-sm font-medium text-sky-600 dark:text-sky-400">
          Our Specialists
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
          Find Your <span className="gradient-title">Doctor</span>
        </h1>
        <p className="text-muted-foreground text-lg animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
          Browse by specialty or view all available healthcare providers
          ready to help you today.
        </p>
      </div>

      {/* Specialty Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4">
        {SPECIALTIES.map((specialty, index) => (
          <Link
            key={specialty.name}
            href={`/doctors/${specialty.name}`}
            className={`animate-in fade-in slide-in-from-bottom-4 duration-1000`}
            style={{ animationDelay: `${index * 50 + 300}ms` }}
          >
            <Card className="bg-card/50 backdrop-blur-md border-sky-200 dark:border-sky-900/20 hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500/10 hover:-translate-y-1 transition-all duration-300 h-full">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full">
                <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center mb-6 shadow-sm border border-sky-100 dark:border-sky-800/30">
                  <div className="text-sky-500 dark:text-sky-400 scale-125">
                    {specialty.icon}
                  </div>
                </div>
                <h3 className="font-semibold text-foreground text-lg">
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
