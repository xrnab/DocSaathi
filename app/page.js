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
import { ImpactStatistics } from "@/components/impact-statistics";
import { FeatureGrid } from "@/components/feature-grid";
import { SeasonalReportGrid } from "@/components/seasonal-report-grid";
import LiveStatsBanner from "@/components/live-stats-banner";
import LiveStatsDialog from "@/components/live-stats-dialog";

export default async function Home() {
  const userRole = await getUserRole();
  return (
    <div className="bg-background">
      <LiveStatsBanner />
      <HomeAiAssistantButton />
      {/* Refactored Hero Section into a Card Layout */}
      <section className="container mx-auto px-4 pt-3 sm:pt-4 pb-6 flex flex-col items-center">
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
        <ImpactStatistics />
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

          <FeatureGrid features={features} userRole={userRole} />
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

          <SeasonalReportGrid seasonalDiseases={seasonalDiseases} />
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
      <LiveStatsDialog />
    </div>
  );
}
