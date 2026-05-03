import { verifyAdmin, verifyOwner } from "@/actions/admin";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "./components/admin-tabs";
import { Suspense } from "react";

export const metadata = {
  title: "Admin Settings - DocSaathi",
  description: "Manage doctors, patients, and platform settings",
};

export default async function AdminLayout({ children }) {
  // Verify the user has admin access
  const admin = await verifyAdmin();

  // Redirect if not an admin
  if (!admin) {
    redirect("/onboarding");
  }

  // Check if current user is the Owner
  const isOwner = await verifyOwner();

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <PageHeader icon={<ShieldCheck />} title="Admin Settings" />

      <Suspense fallback={<div className="h-96 flex items-center justify-center">Loading...</div>}>
        <AdminTabs isOwner={isOwner}>
          {children}
        </AdminTabs>
      </Suspense>
    </div>
  );
}
