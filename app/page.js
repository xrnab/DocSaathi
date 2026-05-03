import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Stethoscope, MapPin, Activity, Pill, FileText, Hospital } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Pricing from "@/components/pricing";
import { creditBenefits, features, testimonials } from "@/lib/data";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { getUserRole } from "@/actions/records";

import SymptomChecker from "@/components/symptom-checker";
import { HomeAiAssistantButton } from "@/components/home-ai-assistant-button";
import NearbyDoctors from "@/components/nearby-doctors";

export default async function Home() {
  const userRole = await getUserRole();
  return (
    <div className="bg-background">
      <HomeAiAssistantButton />
      {/* Hero Section */}
      <section className="relative overflow-hidden py-32 flex items-center justify-center min-h-[90vh]">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 dark:bg-sky-500/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge
                variant="outline"
                className="bg-sky-500/10 border-sky-500/30 px-4 py-2 text-sky-600 dark:text-sky-400 text-sm font-medium backdrop-blur-sm"
              >
                Healthcare made simple
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-foreground leading-tight animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100 tracking-tight py-2">
                Connect with doctors <br />
                <span className="gradient-title">anytime, anywhere</span>
              </h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                Book appointments, consult via video, and manage your healthcare
                journey all in one highly secure platform.
              </p>
              {/* Action Buttons Grid for responsiveness */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 w-full max-w-2xl mx-auto lg:mx-0">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-sky-500 text-white hover:from-blue-700 hover:to-sky-600 shadow-lg shadow-sky-500/20 text-md sm:text-lg h-12 sm:h-14 px-4 sm:px-8 rounded-full transition-all hover:scale-[1.02] sm:col-span-2 lg:col-span-1"
                >
                  <Link href="/onboarding" className="flex items-center justify-center">
                    Get Started <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-sky-500/30 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-300 bg-background/50 backdrop-blur-sm text-md sm:text-lg h-12 sm:h-14 px-4 sm:px-8 rounded-full transition-all w-full flex items-center justify-center"
                >
                  <Link href="/doctors" className="w-full h-full flex items-center justify-center">
                    <Stethoscope className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Find Doctors
                  </Link>
                </Button>
                {/* NEW: Symptom Checker */}
                <Button
                  asChild
                  variant="secondary"
                  size="lg"
                  className="bg-sky-100 hover:bg-sky-200 text-sky-700 dark:bg-sky-900/40 dark:hover:bg-sky-800/60 dark:text-sky-300 text-md sm:text-lg h-12 sm:h-14 px-4 sm:px-8 rounded-full transition-all w-full flex items-center justify-center"
                >
                  <Link href="#symptom-checker" className="w-full h-full flex items-center justify-center">
                    <Activity className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Symptom Checker
                  </Link>
                </Button>
                {/* NEW: Medicine Finder */}
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-sky-500/30 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-300 bg-background/50 backdrop-blur-sm text-md sm:text-lg h-12 sm:h-14 px-4 sm:px-8 rounded-full transition-all w-full flex items-center justify-center"
                >
                  <Link href="/medicines" className="w-full h-full flex items-center justify-center">
                    <Pill className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Pharmacy Locator
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-sky-500/30 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-300 bg-background/50 backdrop-blur-sm text-md sm:text-lg h-12 sm:h-14 px-4 sm:px-8 rounded-full transition-all w-full flex items-center justify-center"
                >
                  <Link href="/facilities" className="w-full h-full flex items-center justify-center">
                    <Hospital className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-red-500" /> Hospitals & Clinics
                  </Link>
                </Button>
                {/* NEW: Patient Records (Dynamic based on Role) */}
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-sky-500/30 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-300 bg-background/50 backdrop-blur-sm text-md sm:text-lg h-12 sm:h-14 px-4 sm:px-8 rounded-full transition-all w-full flex items-center justify-center"
                >
                  {userRole === "DOCTOR" || userRole === "ADMIN" || userRole === "OWNER" ? (
                    <Link href="/doctor/patients" className="w-full h-full flex items-center justify-center">
                      <FileText className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Patient Records
                    </Link>
                  ) : (
                    <Link href="/records" className="w-full h-full flex items-center justify-center">
                      <FileText className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Health Records
                    </Link>
                  )}
                </Button>
              </div>
            </div>

            <div className="relative h-[400px] lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl shadow-sky-900/20 border border-border bg-card/30 backdrop-blur-sm">
              <Image
                src="/hero-duo.png"
                alt="Indian Medical Professionals Duo"
                fill
                priority
                className="object-cover"
              />
              {/* Subtle inner glow for image container */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />

              {/* Interactive Nearby Doctor Widget */}
              <NearbyDoctors />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our platform makes healthcare accessible with just a few clicks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              let href = feature.href;
              let title = feature.title;
              let description = feature.description;
              
              // Dynamic link and content for Admin/Owner
              if (userRole === "ADMIN" || userRole === "OWNER") {
                if (title === "Create Your Profile") {
                  title = "Manage Users";
                  description = "Control user roles and manage account settings for all platform members.";
                  href = "/admin?tab=users";
                } else if (title === "Book Appointments") {
                  title = "Pending Verifications";
                  description = "Review and verify new doctor registrations to ensure platform quality.";
                  href = "/admin?tab=pending";
                } else if (title === "Video Consultation") {
                  title = "Monitor Payouts";
                  description = "Track and process doctor earnings and platform financial transactions.";
                  href = "/admin?tab=payouts";
                } else if (title === "Consultation Credits") {
                  title = "Platform Analytics";
                  description = "View detailed reports on consultations, revenue, and platform growth.";
                  href = "/admin";
                } else if (title === "Verified Doctors") {
                  title = "Doctor Management";
                  description = "Manage verified healthcare providers and update their status.";
                  href = "/admin?tab=doctors";
                } else if (title === "Medical Documentation") {
                  title = "Patient Records";
                  description = "Access comprehensive medical documentation and history across the platform.";
                  href = "/doctor/patients";
                }
              } else if (userRole === "DOCTOR") {
                if (title === "Create Your Profile") {
                  title = "Professional Profile";
                  description = "Manage your medical credentials, specialty, and consultation availability.";
                  href = "/doctor/profile";
                } else if (title === "Book Appointments") {
                  title = "My Appointments";
                  description = "View your scheduled consultations and manage your daily healthcare calendar.";
                  href = "/doctor";
                } else if (title === "Video Consultation") {
                  title = "Telemedicine Hub";
                  description = "Launch secure video consultations and provide remote medical care to patients.";
                  href = "/doctor";
                } else if (title === "Consultation Credits") {
                  title = "Earnings Overview";
                  description = "Track your earned credits and monitor your monthly consultation revenue.";
                  href = "/doctor";
                } else if (title === "Verified Doctors") {
                  title = "Find Colleagues";
                  description = "Connect and collaborate with other verified healthcare specialists on the platform.";
                  href = "/doctors";
                } else if (title === "Medical Documentation") {
                  title = "Patient Records";
                  description = "Access and update medical records for all patients you have consulted.";
                  href = "/doctor/patients";
                }
              } else {
                // Dynamic link for Medical Documentation feature card for non-admins/non-doctors
                if (title === "Medical Documentation") {
                  href = "/records";
                }
              }

              return (
                <Link href={href || "#"} key={index} className="block group">
                  <Card
                    className="bg-card/30 backdrop-blur-xl border border-sky-500/10 hover:border-sky-500/30 hover:shadow-2xl hover:shadow-sky-500/10 transition-all duration-300 relative overflow-hidden h-full group"
                  >
                    {/* Subtle gradient hover effect inside card */}
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader className="pb-2">
                      <div className="bg-sky-500/20 p-3 rounded-lg w-fit mb-4">
                        {feature.icon}
                      </div>
                      <CardTitle className="text-xl font-semibold text-foreground group-hover:text-sky-500 transition-colors">
                        {title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Symptom Checker Section */}
      <SymptomChecker />

      {/* Pricing Section */}
      <section id="pricing" className="py-20">

        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge
              variant="outline"
              className="bg-sky-500/10 border-sky-500/30 px-4 py-1 text-sky-600 dark:text-sky-400 text-sm font-medium mb-4 backdrop-blur-sm"
            >
              Affordable Healthcare
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Consultation Packages
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose the perfect consultation package that fits your healthcare
              needs
            </p>
          </div>

          <div className="mx-auto">
            {/* Clerk Pricing Table */}
            <Pricing />

            {/* Description */}
            <Card className="mt-12 bg-card/30 backdrop-blur-xl border border-sky-500/10 shadow-2xl shadow-sky-900/10">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                  <Stethoscope className="h-5 w-5 mr-2 text-sky-600 dark:text-sky-400" />
                  How Our Credit System Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {creditBenefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <div className="mr-3 mt-1 bg-sky-500/20 p-1 rounded-full">
                        <svg
                          className="h-4 w-4 text-sky-600 dark:text-sky-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                      </div>
                      <p
                        className="text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: benefit }}
                      />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials with green medical accents */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge
              variant="outline"
              className="bg-sky-500/10 border-sky-500/30 px-4 py-1 text-sky-600 dark:text-sky-400 text-sm font-medium mb-4 backdrop-blur-sm"
            >
              Success Stories
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Our Users Say
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Hear from patients and doctors who use our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="bg-card/50 backdrop-blur-md border-sky-500/20 hover:border-sky-500/40 transition-all hover:shadow-lg hover:shadow-sky-500/10"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-sky-500/20 flex items-center justify-center mr-4">
                      <span className="text-sky-600 dark:text-sky-400 font-bold">
                        {testimonial.initials}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    &quot;{testimonial.quote}&quot;
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with green medical styling */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-blue-900/40 to-sky-900/20 border-sky-800/30 backdrop-blur-lg">
            <CardContent className="p-8 md:p-12 lg:p-16 relative overflow-hidden">
              <div className="max-w-2xl relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Ready to take control of your healthcare?
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Join thousands of users who have simplified their healthcare
                  journey with our platform. Get started today and experience
                  healthcare the way it should be.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <SignedOut>
                    <Button
                      asChild
                      size="lg"
                      className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                    >
                      <Link href="/sign-up">Sign Up Now</Link>
                    </Button>
                  </SignedOut>
                  <SignedIn>
                    <Button
                      asChild
                      size="lg"
                      className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                    >
                      <Link href="/doctors">Find Doctors</Link>
                    </Button>
                  </SignedIn>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-sky-500/30 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-300"
                  >
                    <Link href="#pricing">View Pricing</Link>
                  </Button>
                </div>
              </div>

              {/* Decorative healthcare elements */}
              <div className="absolute right-0 top-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
              <div className="absolute left-0 bottom-0 w-[200px] h-[200px] bg-sky-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
