"use client";

import { UserButton, SignIn, SignUp, UserProfile, PricingTable } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";
import { useEffect, useState } from "react";

export function ThemeAwarePricingTable(props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

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
