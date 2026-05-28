import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CreditCard, Shield, Check, ShieldCheck, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Pricing from "@/components/pricing";

export default async function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header Section */}
      <div className="flex justify-start mb-2">
        <Link
          href="/"
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
      </div>

      <div className="max-w-full mx-auto mb-12 text-center">
        <Badge
          variant="outline"
          className="bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-700/30 px-4 py-1 text-sky-600 dark:text-sky-400 text-sm font-medium mb-4"
        >
          Affordable Healthcare
        </Badge>

        <h1 className="text-4xl md:text-5xl font-bold gradient-title mb-4">
          Simple, Transparent Pricing
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose the perfect consultation package that fits your healthcare
          needs with no hidden fees or long-term commitments
        </p>
      </div>

      {/* Ayushman Bharat PMJAY Coverage Alert */}
      <div className="max-w-5xl mx-auto mb-10">
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500/5 via-emerald-600/[0.02] to-emerald-500/5 backdrop-blur-xl border border-emerald-500/20 rounded-[2.5rem] p-6 sm:p-8 shadow-xl shadow-emerald-950/5 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Saffron/Green Decorative Glows */}
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-amber-500/10 blur-2xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full pointer-events-none" />

          <div className="flex gap-4 items-start text-left flex-1">
            <div className="relative flex-shrink-0 bg-gradient-to-br from-emerald-400 to-emerald-600 p-3.5 rounded-2xl shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="h-7 w-7 text-white" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500" />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  Government Initiative
                </span>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">
                  Ayushman Bharat / PMJAY Covered
                </h3>
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                Already covered under PMJAY? Most families in Nabha qualify! Many of your telemedicine, clinic consultation, and checkup services may be completely free. Show your card at local empanelled hospitals for free treatment.
              </p>
            </div>
          </div>

          <div className="flex-shrink-0 w-full md:w-auto">
            <a
              href="https://pmjay.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full md:w-auto items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold rounded-full h-12 px-6 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] hover:shadow-emerald-500/30 text-sm whitespace-nowrap"
            >
              Check Eligibility <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Pricing Table Section */}
      <Pricing />

      {/* FAQ Section - Optional */}
      <div className="max-w-3xl mx-auto mt-16 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Questions? We're Here to Help
        </h2>
        <p className="text-muted-foreground mb-4">
          Contact our support team at docsathiin@gmail.com
        </p>
      </div>
    </div>
  );
}
