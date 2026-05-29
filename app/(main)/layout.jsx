import React from "react";
import SOSButton from "@/components/sos-button";
import { AccessibilityProvider } from "@/lib/accessibility-context";
import { getCurrentUser } from "@/actions/onboarding";
import { Home, Stethoscope, ClipboardList, Heart } from "lucide-react";
import Link from "next/link";

const MainLayout = async ({ children }) => {
  const user = await getCurrentUser();
  const role = user?.role || "UNASSIGNED";

  const sidebarItems = [
    { href: "/patients", label: "Dashboard", icon: Home, color: "text-sky-500" },
    { href: "/doctors", label: "Doctors Directory", icon: Stethoscope, color: "text-indigo-500" },
    { href: "/records", label: "Health Records", icon: ClipboardList, color: "text-emerald-500" },
    { href: "/pregnancy", label: "Pregnancy Care", icon: Heart, color: "text-pink-500" },
  ];

  return (
    <AccessibilityProvider>
      <div className="container mx-auto mt-4 sm:mt-6 mb-20 px-4 max-w-7xl">
        {role === "PATIENT" ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            {/* Desktop Sidebar Navigation */}
            <aside className="hidden lg:block lg:col-span-1 bg-card/60 backdrop-blur-xl border border-border p-5 rounded-3xl space-y-4 lg:sticky lg:top-24">
              <div className="space-y-1.5 pl-2 pb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Patient Hub Menu</span>
              </div>
              <nav className="space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all border border-transparent hover:border-border/30 group"
                    >
                      <Icon className={`h-4 w-4 ${item.color} group-hover:scale-110 transition-transform`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </aside>

            {/* Content Area */}
            <main className="lg:col-span-3">
              {children}
            </main>
          </div>
        ) : (
          <div>
            {children}
          </div>
        )}
        <SOSButton />
      </div>
    </AccessibilityProvider>
  );
};

export default MainLayout;
