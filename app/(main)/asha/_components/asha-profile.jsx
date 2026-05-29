"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAshaProfile } from "@/actions/onboarding";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, User, Heart, ShieldAlert, Mail, MapPin, Building, Globe } from "lucide-react";
import { useEffect } from "react";

const ashaProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  ashaId: z.string().min(3, "ASHA ID must be at least 3 characters"),
  village: z.string().min(2, "Village name must be at least 2 characters"),
  block: z.string().min(2, "Block name must be at least 2 characters"),
});

export function AshaProfile({ user }) {
  const router = useRouter();
  const { loading, data, fn: submitProfileUpdate } = useFetch(updateAshaProfile);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ashaProfileSchema),
    defaultValues: {
      name: user.name || "",
      ashaId: user.ashaId || "",
      village: user.village || "",
      block: user.block || "",
    },
  });

  const onSubmit = async (values) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value);
    });
    await submitProfileUpdate(formData);
  };

  useEffect(() => {
    if (data?.success) {
      toast.success("ASHA card and profile updated successfully!");
      router.refresh();
      // Wait a short bit and reload to update state cleanly
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, [data, router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-16 h-16 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center border border-sky-200 dark:border-sky-800/30">
          <User className="h-8 w-8 text-sky-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Manage Your ASHA Card</h2>
          <p className="text-muted-foreground">Keep your accreditation and village region settings up to date</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identity & Card Details */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader suppressHydrationWarning>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-sky-500" />
                Accreditation Details
              </CardTitle>
              <CardDescription>Government registry identity settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">ASHA Worker Name</Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  {...register("name")}
                  className="rounded-xl bg-slate-50/50 dark:bg-slate-900/30"
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ashaId">ASHA Worker ID Card Number</Label>
                <Input
                  id="ashaId"
                  placeholder="e.g. ASHA-PB-14785"
                  {...register("ashaId")}
                  className="rounded-xl bg-slate-50/50 dark:bg-slate-900/30 font-mono"
                />
                {errors.ashaId && <p className="text-xs text-red-500">{errors.ashaId.message}</p>}
              </div>

              <div className="p-4 bg-sky-50 dark:bg-sky-900/10 border border-sky-200 dark:border-sky-900/30 rounded-2xl flex items-start gap-3 mt-4">
                <Mail className="h-5 w-5 text-sky-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-bold text-sky-900 dark:text-sky-200">Registered Email</p>
                  <p className="text-sky-850 dark:text-sky-300 opacity-80">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regional Settings */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader suppressHydrationWarning>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-500" />
                Assigned Village Jurisdiction
              </CardTitle>
              <CardDescription>Configure local household mapping and health regions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="village">Assigned Village</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    id="village"
                    placeholder="e.g. Sauja"
                    {...register("village")}
                    className="pl-9 rounded-xl bg-slate-50/50 dark:bg-slate-900/30"
                  />
                </div>
                {errors.village && <p className="text-xs text-red-500">{errors.village.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="block">Health Block / Sub-district</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    id="block"
                    placeholder="e.g. Nabha, Patiala"
                    {...register("block")}
                    className="pl-9 rounded-xl bg-slate-50/50 dark:bg-slate-900/30"
                  />
                </div>
                {errors.block && <p className="text-xs text-red-500">{errors.block.message}</p>}
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl flex items-start gap-3 mt-4">
                <Heart className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-bold text-emerald-900 dark:text-emerald-200">Community Outreach</p>
                  <p className="text-emerald-850 dark:text-emerald-300 opacity-85">
                    Modifying regional settings affects dynamic village outbreaks surveillance mapping.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            className="w-full md:w-64 h-12 bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-500/20 font-bold rounded-xl cursor-pointer"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Updating ASHA Card...
              </>
            ) : (
              "Save Card Details"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
