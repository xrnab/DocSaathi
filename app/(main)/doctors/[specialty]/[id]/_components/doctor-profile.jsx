// /app/doctors/[id]/_components/doctor-profile.jsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Calendar,
  Clock,
  Medal,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { SlotPicker } from "./slot-picker";
import { AppointmentForm } from "./appointment-form";
import { formatDoctorName } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function DoctorProfile({ doctor, availableDays, viewer }) {
  const [showBooking, setShowBooking] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const router = useRouter();

  const viewerRole = viewer?.role || null;
  const canBookAppointments =
    viewerRole === "PATIENT" || viewerRole === "ADMIN";

  // Calculate total available slots
  const totalSlots = availableDays?.reduce(
    (total, day) => total + day.slots.length,
    0
  );

  const toggleBooking = () => {
    setShowBooking(!showBooking);
    if (!showBooking) {
      // Scroll to booking section when expanding
      setTimeout(() => {
        document.getElementById("booking-section")?.scrollIntoView({
          behavior: "smooth",
        });
      }, 100);
    }
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleBookingComplete = () => {
    router.push("/appointments");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left column - Doctor Photo and Quick Info (fixed on scroll) */}
      <div className="md:col-span-1">
        <div className="md:sticky md:top-24">
          <Card className="border-sky-900/20">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4 bg-sky-900/20">
                  {doctor.imageUrl ? (
                    <Image
                      src={doctor.imageUrl}
                      alt={doctor.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-16 w-16 text-sky-400" />
                    </div>
                  )}
                </div>

                <h2 className="text-xl font-bold text-foreground mb-1">
                  {formatDoctorName(doctor.name)}
                </h2>

                <Badge
                  variant="outline"
                  className="bg-sky-900/20 border-sky-900/30 text-sky-400 mb-4"
                >
                  {doctor.specialty}
                </Badge>

                <div className="flex items-center justify-center mb-2">
                  <Medal className="h-4 w-4 text-sky-400 mr-2" />
                  <span className="text-muted-foreground">
                    {doctor.experience} years experience • {doctor.gender}
                  </span>
                </div>

                {doctor.languages && doctor.languages.length > 0 && (
                  <div className="text-sm text-sky-400/80 mb-2 flex gap-1 flex-wrap justify-center max-w-[200px]">
                    <span className="text-muted-foreground mr-1">Speaks:</span>
                    {doctor.languages.map((lang, idx) => (
                      <span key={lang} className="capitalize">
                        {lang}{idx < doctor.languages.length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                )}

                {canBookAppointments ? (
                  <Button
                    onClick={toggleBooking}
                    className="w-full bg-sky-600 hover:bg-sky-700 mt-4"
                  >
                    {showBooking ? (
                      <>
                        Hide Booking
                        <ChevronUp className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Book Appointment
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : !viewer ? (
                  <Button asChild className="w-full bg-sky-600 hover:bg-sky-700 mt-4">
                    <Link href="/sign-in?redirect_url=/doctors">Sign in to Book</Link>
                  </Button>
                ) : (
                  <Button
                    onClick={toggleBooking}
                    variant="outline"
                    className="w-full mt-4 border-sky-300 text-sky-700"
                  >
                    Booking Requirements
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right column - Doctor Details and Booking Section */}
      <div className="md:col-span-2 space-y-6">
        <Card className="border-sky-900/20">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">
              About {formatDoctorName(doctor.name)}
            </CardTitle>
            <CardDescription>
              Professional background and expertise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-sky-400" />
                <h3 className="text-foreground font-medium">Description</h3>
              </div>
              <p className="text-muted-foreground whitespace-pre-line">
                {doctor.description}
              </p>
            </div>

            <Separator className="bg-sky-900/20" />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-sky-400" />
                <h3 className="text-foreground font-medium">Availability</h3>
              </div>
              {totalSlots > 0 ? (
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-sky-400 mr-2" />
                  <p className="text-muted-foreground">
                    {totalSlots} time slots available for booking over the next
                    4 days
                  </p>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No available slots for the next 4 days. Please check back
                    later.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Booking Section - Conditionally rendered */}
        {showBooking && (
          <div id="booking-section">
            <Card className="border-sky-900/20">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground">
                  Book an Appointment
                </CardTitle>
                <CardDescription>
                  Select a time slot and provide details for your consultation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!viewer ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please sign in with a patient account to book an appointment.
                    </AlertDescription>
                  </Alert>
                ) : !canBookAppointments ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {viewerRole === "UNASSIGNED"
                        ? "Please complete your profile as a patient before booking an appointment."
                        : "Only patient or admin accounts can book appointments."}
                    </AlertDescription>
                  </Alert>
                ) : totalSlots > 0 ? (
                  <>
                    {/* Slot selection step */}
                    {!selectedSlot && (
                      <SlotPicker
                        days={availableDays}
                        onSelectSlot={handleSlotSelect}
                      />
                    )}

                    {/* Appointment form step */}
                    {selectedSlot && (
                      <AppointmentForm
                        doctorId={doctor.id}
                        slot={selectedSlot}
                        onBack={() => setSelectedSlot(null)}
                        onComplete={handleBookingComplete}
                      />
                    )}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-xl font-medium text-foreground mb-2">
                      No available slots
                    </h3>
                    <p className="text-muted-foreground">
                      This doctor doesn&apos;t have any available appointment
                      slots for the next 4 days. Please check back later or try
                      another doctor.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
