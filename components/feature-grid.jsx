"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FeatureGrid({ features, userRole }) {
  return (
    <div className="w-full relative overflow-hidden">
      {/* Mobile: Horizontal Scroll with Pop-up effect | Desktop: Standard Grid */}
      <div className="flex flex-row md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar pb-10 pt-4 md:py-0 w-full">
        {features.map((feature, index) => {
          let href = feature.href;
          let title = feature.title;
          let description = feature.description;
          
          // Dynamic link and content logic
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
          } else if (userRole === "ASHA_WORKER") {
            if (title === "Create Your Profile") {
              title = "ASHA Worker Profile";
              description = "Manage your Clerk settings, ASHA ID card details, block name, and village jurisdiction.";
              href = "/asha?tab=profile";
            } else if (title === "Book Appointments") {
              title = "Proxy Book Doctor";
              description = "Schedule medical consultations with verified clinic specialists on behalf of village patients.";
              href = "/asha?tab=proxy";
            } else if (title === "Video Consultation") {
              title = "SOS Emergency Hub";
              description = "Receive, respond, and route doctors immediately for active village critical health alerts.";
              href = "/asha?tab=emergency";
            } else if (title === "Consultation Credits") {
              title = "Earned Credits & Payouts";
              description = "Review your accumulated government credit balance, track financials, and request payouts.";
              href = "/asha?tab=earnings";
            } else if (title === "Verified Doctors") {
              title = "Colleague Specialists";
              description = "Browse clinical professionals verified by the platform and check their availability.";
              href = "/doctors";
            } else if (title === "Medical Documentation") {
              title = "Household Registries";
              description = "Access and update family health registry cards and local child/maternal immunisations.";
              href = "/asha?tab=registry";
            }
          } else {
            if (title === "Medical Documentation") {
              href = "/records";
            }
          }

          return (
            <motion.div 
              key={index} 
              initial={{ scale: 0.9, opacity: 0.8 }}
              whileInView={{ 
                scale: 1, 
                opacity: 1, 
                transition: { duration: 0.4 } 
              }}
              viewport={{ 
                once: false, 
                amount: 0.8
              }}
              className="shrink-0 snap-center transition-all duration-300"
            >
              <Link href={href || "#"} className="block group h-full">
                <Card
                  className={cn(
                    "bg-card/30 backdrop-blur-xl border border-sky-500/10 hover:border-sky-500/30 hover:shadow-2xl hover:shadow-sky-500/10 transition-all duration-300 relative overflow-hidden h-full group",
                    "w-64 h-64 sm:w-72 sm:h-72 md:w-auto md:h-auto md:aspect-auto flex flex-col justify-center text-center md:text-left rounded-[2.5rem] md:rounded-2xl",
                    "aspect-square md:aspect-auto"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="pb-2 flex flex-col items-center md:items-start">
                    <div className="bg-sky-500/20 p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg sm:text-xl font-bold text-foreground group-hover:text-sky-500 transition-colors">
                      {title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center md:items-start">
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 md:line-clamp-none">
                      {description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
      
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @media (max-width: 767px) {
          .snap-center {
            transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
        }
      `}</style>
    </div>
  );
}
