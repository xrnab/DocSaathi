import { User, Star, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDoctorName } from "@/lib/utils";
import Image from "next/image";

export function DoctorCard({ doctor }) {
  return (
    <div className="relative group">
      {/* Mobile-only absolute link wrapping the whole card area */}
      <Link 
        href={`/doctors/${doctor.specialty}/${doctor.id}`}
        className="sm:hidden absolute inset-0 z-10"
      />
      <Card className="border-sky-200 dark:border-sky-900/20 hover:border-sky-400 dark:hover:border-sky-500/40 hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center flex-shrink-0 border border-sky-100 dark:border-sky-800/30">
              {doctor.imageUrl ? (
                <Image
                  src={doctor.imageUrl}
                  alt={doctor.name || "Doctor profile"}
                  width={64}
                  height={64}
                  loading="lazy"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-sky-500 dark:text-sky-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                <h3 className="font-semibold text-foreground text-xl truncate">{formatDoctorName(doctor.name)}</h3>
                <div className="flex flex-wrap gap-1.5 self-start">
                  {doctor.experience % 2 === 0 && (
                    <>
                      <Badge
                        variant="outline"
                        className="bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold shrink-0"
                      >
                        📍 Near Nabha
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-extrabold shrink-0"
                      >
                        🇮🇳 PMJAY / Ayushman
                      </Badge>
                    </>
                  )}
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold shrink-0"
                  >
                    ⚡ Telemedicine
                  </Badge>
                </div>
              </div>

              <div className="flex items-center mb-2">
                <Badge
                  variant="outline"
                  className="bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800/50 text-sky-600 dark:text-sky-400 font-bold shrink-0"
                >
                  <Star className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mb-1">
                {doctor.specialty} • {doctor.experience} years exp • {doctor.gender}
              </p>
              {doctor.languages && doctor.languages.length > 0 && (
                <p className="text-xs text-sky-600/80 dark:text-sky-400/80 mb-1 font-medium flex gap-1 flex-wrap">
                  Speaks: {doctor.languages.map((lang, idx) => (
                    <span key={lang} className="capitalize">
                      {lang}{idx < doctor.languages.length - 1 ? ',' : ''}
                    </span>
                  ))}
                </p>
              )}

              <div className="mt-3 line-clamp-2 text-sm text-muted-foreground mb-4">
                {doctor.description}
              </div>

              {/* Desktop-only right-aligned button layout */}
              <div className="hidden sm:flex justify-end mt-3">
                <Button
                  asChild
                  className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 mt-2 shadow-sm font-bold h-10 px-6 rounded-xl"
                >
                  <Link href={`/doctors/${doctor.specialty}/${doctor.id}`}>
                    <Calendar className="h-4 w-4 mr-2" />
                    View Profile & Book
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
