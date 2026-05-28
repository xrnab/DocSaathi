import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Stethoscope, MapPin, Activity, Pill, FileText, Hospital } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Pricing from "@/components/pricing";
import { creditBenefits, features, testimonials, seasonalDiseases } from "@/lib/data";
import { Show } from "@/components/clerk-elements";
import { getUserRole } from "@/actions/records";

import SymptomChecker from "@/components/symptom-checker";
import { HomeAiAssistantButton } from "@/components/home-ai-assistant-button";
import NearbyDoctors from "@/components/nearby-doctors";
import { OfflineEmergencyCard } from "@/components/offline-emergency-card";

export default async function Home() {
  const userRole = await getUserRole();
  return (
    <div className="bg-background">
      <HomeAiAssistantButton />
      {/* Refactored Hero Section into a Card Layout */}
      <section className="container mx-auto px-4 pt-1 sm:pt-2 pb-6 flex flex-col items-center">
        <Card className="w-full relative overflow-hidden border-none shadow-2xl rounded-[2.5rem] sm:rounded-[4rem] bg-slate-950 min-h-[60vh] sm:min-h-[40vh] lg:min-h-[35vh] flex flex-col">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/card-layout-img.png"
              alt="Healthcare in Nabha"
              fill
              priority
              className="object-cover object-right opacity-50 sm:opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent lg:block hidden" />
            <div className="absolute inset-0 bg-slate-950/80 lg:hidden block" />
          </div>

          <CardContent className="relative z-10 flex-1 flex flex-col justify-center p-6 sm:p-10 md:p-14 pt-20 sm:pt-16 md:pt-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center w-full">
              <div className="space-y-4 sm:space-y-4 text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
                <Badge
                  variant="outline"
                  className="bg-sky-500/20 border-sky-400/30 px-3 py-1 text-sky-300 text-[10px] sm:text-xs font-medium backdrop-blur-md"
                >
                  Healthcare made simple
                </Badge>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight py-1">
                  Nabha da Saathi <br className="hidden sm:block" />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-400">
                    Healthcare at your fingertips
                  </span>
                </h1>
                <p className="text-slate-300 text-sm sm:text-base md:text-base max-w-md mx-auto lg:mx-0 font-medium leading-relaxed">
                  Book appointments, consult via video, and manage your health journey in one secure platform.
                </p>
                
                {/* Action Buttons Grid */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-3 pt-2">
                  <Button
                    asChild
                    size="lg"
                    className="bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-500/20 h-10 sm:h-11 px-6 sm:px-7 rounded-full text-xs sm:text-sm font-bold transition-transform hover:scale-105"
                  >
                    <Link href="/onboarding" className="flex items-center justify-center">
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 h-10 sm:h-11 px-6 sm:px-7 rounded-full text-xs sm:text-sm font-bold transition-transform hover:scale-105"
                  >
                    <Link href="/doctors" className="flex items-center justify-center">
                      <Stethoscope className="mr-2 h-4 w-4" /> Doctors
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Interactive Component Placement */}
              <div className="hidden lg:block relative h-full min-h-[200px]">
                 <NearbyDoctors />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Impact Statistics Below Hero Card */}
        <div className="w-full mt-6 sm:mt-8 px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-center max-w-6xl mx-auto">
            <div className="text-center md:text-left space-y-2 p-4 rounded-2xl bg-sky-500/5 border border-sky-500/10 backdrop-blur-sm">
              <div className="text-3xl sm:text-4xl font-black text-sky-600 dark:text-sky-400">45+</div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Surrounding Villages Covered</p>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-tight mt-1">Providing direct digital access to remote agricultural hubs</p>
              </div>
            </div>
            <div className="text-center md:text-left space-y-2 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-sm">
              <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">12+</div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Doctors in Nabha District</p>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-tight mt-1">Local specialists and GPs ready for immediate telemedicine</p>
              </div>
            </div>
            <div className="text-center md:text-left space-y-2 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 backdrop-blur-sm">
              <div className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400">42 km</div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Nearest Hospital (Patiala)</p>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-tight mt-1">Saving rural families critical hours in transport and triaging</p>
              </div>
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

      {/* Quick Report: Common in Nabha this season */}
      <section className="py-20 bg-background relative overflow-hidden">
        {/* Subtle background gradient to make section feel premium */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 dark:bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge
              variant="outline"
              className="bg-amber-500/10 border-amber-500/30 px-4 py-1 text-amber-600 dark:text-amber-400 text-sm font-semibold mb-4 backdrop-blur-sm"
            >
              ⚠️ Local Health Advisory
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
              Common in Nabha <span className="gradient-title">This Season</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Stay informed with real-time seasonal health reports for our agricultural district. Updated: May 2026.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {seasonalDiseases.map((disease) => (
              <Card key={disease.id} className="bg-card/30 backdrop-blur-xl border border-sky-500/10 hover:border-sky-500/30 transition-all duration-300 rounded-[2rem] overflow-hidden group hover:shadow-xl hover:shadow-sky-500/5">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <Badge variant="outline" className={`${disease.statusColor} font-black uppercase text-[9px] tracking-wider py-1 px-2.5 rounded-full border`}>
                      {disease.riskLevel}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-full">Monthly Update</span>
                  </div>
                  <CardTitle className="text-2xl font-black text-foreground mt-4 group-hover:text-sky-500 transition-colors">
                    {disease.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Symptoms</p>
                    <div className="flex flex-wrap gap-1.5">
                      {disease.symptoms.map((symptom, idx) => (
                        <span key={idx} className="text-xs bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-xl text-slate-600 dark:text-slate-400 font-semibold">
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prevention Plan</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {disease.prevention}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Offline Emergency Card Section */}
      <section className="pb-20 bg-background relative z-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <OfflineEmergencyCard />
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
                  <Show when="signed-out">
                    <Button
                      asChild
                      size="lg"
                      className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                    >
                      <Link href="/sign-up">Sign Up Now</Link>
                    </Button>
                  </Show>
                  <Show when="signed-in">
                    <Button
                      asChild
                      size="lg"
                      className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                    >
                      <Link href="/doctors">Find Doctors</Link>
                    </Button>
                  </Show>
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
