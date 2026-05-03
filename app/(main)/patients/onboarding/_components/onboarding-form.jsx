"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updatePatientMedicalProfile } from "@/actions/onboarding";
import useFetch from "@/hooks/use-fetch";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Activity, User, HeartPulse, ClipboardList } from "lucide-react";
import { useEffect } from "react";

const medicalSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.number().min(0).max(120),
  height: z.number().min(30).max(300),
  weight: z.number().min(1).max(500),
  bloodType: z.string().min(1, "Blood type is required"),
  gender: z.string().min(1, "Gender is required"),
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
});

export default function OnboardingForm({ user }) {
  const router = useRouter();
  const { loading, data, fn: updateProfile } = useFetch(updatePatientMedicalProfile);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(medicalSchema),
    defaultValues: {
      name: user?.name || "",
      age: user?.age || undefined,
      height: user?.height || undefined,
      weight: user?.weight || undefined,
      bloodType: user?.bloodType || "",
      gender: user?.gender || "",
      medicalHistory: user?.medicalHistory || "",
      allergies: user?.allergies || "",
      medications: user?.medications || "",
    },
  });

  const onSubmit = async (values) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value);
    });
    await updateProfile(formData);
  };

  useEffect(() => {
    if (data?.success) {
      toast.success("Medical profile updated successfully!");
      router.push("/patients");
    }
  }, [data, router]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Physical Metrics */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-sky-500" />
              Physical Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Your full name"
                {...register("name")}
                className="bg-background border-border"
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="Your age"
                {...register("age", { valueAsNumber: true })}
                className="bg-background border-border"
              />
              {errors.age && <p className="text-xs text-red-500">{errors.age.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="e.g. 175"
                  {...register("height", { valueAsNumber: true })}
                  className="bg-background border-border"
                />
                {errors.height && <p className="text-xs text-red-500">{errors.height.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="e.g. 70"
                  {...register("weight", { valueAsNumber: true })}
                  className="bg-background border-border"
                />
                {errors.weight && <p className="text-xs text-red-500">{errors.weight.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bloodType">Blood Group</Label>
                <Select defaultValue={user?.bloodType} onValueChange={(val) => setValue("bloodType", val)}>
                  <SelectTrigger id="bloodType" className="bg-background border-border">
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.bloodType && <p className="text-xs text-red-500">{errors.bloodType.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select defaultValue={user?.gender} onValueChange={(val) => setValue("gender", val)}>
                  <SelectTrigger id="gender" className="bg-background border-border">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Male", "Female"].map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-sky-500" />
              Medical Background
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="allergies">Known Allergies</Label>
              <Textarea
                id="allergies"
                placeholder="e.g. Penicillin, Peanuts (leave empty if none)"
                {...register("allergies")}
                className="bg-background border-border"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medications">Current Medications</Label>
              <Textarea
                id="medications"
                placeholder="List any medications you are currently taking"
                {...register("medications")}
                className="bg-background border-border"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medical History Full Width */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-sky-500" />
            Medical History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="medicalHistory">Past Medical Conditions & Surgeries</Label>
            <Textarea
              id="medicalHistory"
              placeholder="Please describe any major past illnesses, surgeries, or chronic conditions..."
              {...register("medicalHistory")}
              className="bg-background border-border"
              rows={5}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-4">
        <Button 
          type="submit" 
          className="w-full md:w-64 h-12 text-lg font-bold bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-500/20"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Saving Profile...
            </>
          ) : (
            "Complete Onboarding"
          )}
        </Button>
      </div>
    </form>
  );
}
