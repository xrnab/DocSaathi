"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Users, CreditCard, UserCog, Heart } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

export function AdminTabs({ isOwner, children }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentTab = searchParams.get("tab") || "pending";

  const handleTabChange = (value) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    router.push(`/admin?${params.toString()}`);
  };

  return (
    <Tabs
      value={currentTab}
      onValueChange={handleTabChange}
      className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6"
    >
      <TabsList className="md:col-span-1 bg-muted/30 border flex flex-row md:flex-col w-full p-1.5 rounded-xl md:h-auto h-12 overflow-x-auto overflow-y-hidden md:overflow-visible no-scrollbar gap-1">
        <TabsTrigger
          value="pending"
          className="flex-shrink-0 md:flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-auto md:w-full px-3 text-sm whitespace-nowrap"
        >
          <AlertCircle className="h-4 w-4 mr-1.5 md:mr-2 shrink-0" />
          <span>Pending Doctors</span>
        </TabsTrigger>
        <TabsTrigger
          value="doctors"
          className="flex-shrink-0 md:flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-auto md:w-full px-3 text-sm whitespace-nowrap"
        >
          <Users className="h-4 w-4 mr-1.5 md:mr-2 shrink-0" />
          <span>Verified Doctors</span>
        </TabsTrigger>
        <TabsTrigger
          value="patients"
          className="flex-shrink-0 md:flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-auto md:w-full px-3 text-sm whitespace-nowrap"
        >
          <Heart className="h-4 w-4 mr-1.5 md:mr-2 shrink-0" />
          <span>Patients</span>
        </TabsTrigger>
        <TabsTrigger
          value="payouts"
          className="flex-shrink-0 md:flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-auto md:w-full px-3 text-sm whitespace-nowrap"
        >
          <CreditCard className="h-4 w-4 mr-1.5 md:mr-2 shrink-0" />
          <span>Payouts</span>
        </TabsTrigger>
        {isOwner && (
          <TabsTrigger
            value="users"
            className="flex-shrink-0 md:flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-auto md:w-full px-3 text-sm whitespace-nowrap text-sky-600 dark:text-sky-400 font-bold"
          >
            <UserCog className="h-4 w-4 mr-1.5 md:mr-2 shrink-0" />
            <span>User Roles</span>
          </TabsTrigger>
        )}
      </TabsList>
      <div className="md:col-span-3">{children}</div>
    </Tabs>
  );
}
