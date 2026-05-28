"use client";

import { UserButton, SignIn, SignUp, UserProfile, PricingTable } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";
import { useEffect, useState, Component } from "react";

function PricingTableMock() {
  const plans = [
    { name: "Basic", price: "₹0", credits: "10 Credits", features: ["Symptom Checker", "Local Doctor Search", "Public Health Records"] },
    { name: "Pro", price: "₹499", credits: "50 Credits", features: ["Video Consultation", "Priority Booking", "Private Health Vault", "24/7 AI Assistant"], popular: true },
    { name: "Family", price: "₹999", credits: "150 Credits", features: ["Up to 4 Members", "Home Sample Collection", "Insurance Assistance", "Dedicated Health Manager"] }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto p-4">
      {plans.map((plan) => (
        <div key={plan.name} className={`relative flex flex-col p-6 rounded-3xl border ${plan.popular ? "border-sky-500 shadow-xl shadow-sky-500/10 bg-sky-50/50 dark:bg-sky-900/20" : "border-border bg-card"} transition-all hover:scale-[1.02]`}>
          {plan.popular && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              Most Popular
            </span>
          )}
          <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-3xl font-black">{plan.price}</span>
            <span className="text-muted-foreground text-sm">/month</span>
          </div>
          <div className="mb-6 py-2 px-3 bg-sky-500/10 rounded-xl text-sky-600 dark:text-sky-400 font-bold text-sm text-center">
            {plan.credits}
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-center text-sm text-muted-foreground">
                <svg className="h-4 w-4 text-emerald-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
          <button disabled className="w-full py-3 px-4 rounded-xl bg-muted text-muted-foreground font-bold text-sm cursor-not-allowed">
            Setup Billing to Enable
          </button>
        </div>
      ))}
      <div className="col-span-1 md:col-span-3 mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center">
        <p className="text-amber-700 dark:text-amber-400 text-xs font-medium">
          Note: This is a placeholder. To enable real payments, visit your <a href="https://dashboard.clerk.com/last-active?path=billing/settings" target="_blank" rel="noreferrer" className="underline font-bold">Clerk Billing Settings</a>.
        </p>
      </div>
    </div>
  );
}

export function ThemeAwarePricingTable(props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  // Set this to true ONLY after you have configured billing in the Clerk Dashboard.
  // This prevents the application from crashing in development mode.
  const isBillingEnabled = false; 

  if (!isBillingEnabled) {
    return <PricingTableMock />;
  }

  return (
    <PricingTable 
      {...props} 
      appearance={{ 
        baseTheme: resolvedTheme === "dark" ? dark : undefined,
        ...props.appearance 
      }} 
    />
  );
}

export function ThemeAwareUserButton(props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />;

  return (
    <UserButton 
      {...props} 
      appearance={{ 
        baseTheme: resolvedTheme === "dark" ? dark : undefined,
        ...props.appearance 
      }} 
    />
  );
}

export function ThemeAwareSignIn(props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-4">
        <div className="h-12 w-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse">Initializing Secure Login...</p>
      </div>
    );
  }

  return (
    <SignIn 
      {...props} 
      appearance={{ 
        baseTheme: resolvedTheme === "dark" ? dark : undefined,
        ...props.appearance 
      }} 
    />
  );
}

export function ThemeAwareSignUp(props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-4">
        <div className="h-12 w-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse">Preparing Registration...</p>
      </div>
    );
  }

  return (
    <SignUp 
      {...props} 
      appearance={{ 
        baseTheme: resolvedTheme === "dark" ? dark : undefined,
        ...props.appearance 
      }} 
    />
  );
}

export function ThemeAwareUserProfile(props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <UserProfile 
      {...props} 
      appearance={{ 
        baseTheme: resolvedTheme === "dark" ? dark : undefined,
        ...props.appearance 
      }} 
    />
  );
}
