"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateDoctorProfile } from "@/actions/doctor";
import { SPECIALTIES } from "@/lib/specialities";
import { AVAILABLE_LANGUAGES } from "@/lib/languages";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, User, Stethoscope, Mail, Phone, Calendar, Droplet, Globe, Activity, FileText } from "lucide-react";
import { useEffect } from "react";

const doctorProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  specialty: z.string().min(1, "Specialty is required"),
  experience: z.number().min(0).max(70),
  description: z.string().min(20, "Description must be at least 20 characters"),
  age: z.number().min(20).max(100),
  bloodType: z.string().min(1, "Blood type is required"),
  gender: z.string().min(1, "Gender is required"),
  languages: z.array(z.string()).min(1, "Select at least one language"),
});

export function DoctorProfile({ user }) {
  const router = useRouter();
  const { loading, data, fn: updateProfile } = useFetch(updateDoctorProfile);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(doctorProfileSchema),
    defaultValues: {
      name: user.name || "",
      specialty: user.specialty || "",
      experience: user.experience || 0,
      description: user.description || "",
      age: user.age || 30,
      bloodType: user.bloodType || "",
      gender: user.gender || "",
      languages: user.languages || [],
    },
  });

  const languagesValue = watch("languages");
  const specialtyValue = watch("specialty");

  const toggleLanguage = (langValue) => {
    const currentLangs = languagesValue || [];
    if (currentLangs.includes(langValue)) {
      setValue("languages", currentLangs.filter(l => l !== langValue), { shouldValidate: true });
    } else {
      setValue("languages", [...currentLangs, langValue], { shouldValidate: true });
    }
  };

  const onSubmit = async (values) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (key === "languages") {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    });
    await updateProfile(formData);
  };

  useEffect(() => {
    if (data?.success) {
      toast.success("Profile updated successfully!");
      router.refresh();
    }
  }, [data, router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-16 h-16 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
          <User className="h-8 w-8 text-sky-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Manage Your Profile</h2>
          <p className="text-muted-foreground">Keep your professional information up to date</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Professional Details */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-sky-500" />
                Professional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  {...register("name")}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty</Label>
                <Select value={specialtyValue} onValueChange={(val) => setValue("specialty", val)}>
                  <SelectTrigger id="specialty">
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((spec) => (
                      <SelectItem key={spec.name} value={spec.name}>{spec.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.specialty && <p className="text-xs text-red-500">{errors.specialty.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  {...register("experience", { valueAsNumber: true })}
                />
                {errors.experience && <p className="text-xs text-red-500">{errors.experience.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Languages Spoken</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {AVAILABLE_LANGUAGES.map((lang) => (
                    <label key={lang.value} className="flex items-center space-x-2 cursor-pointer border p-2 rounded-md hover:bg-muted/50 border-border transition-colors">
                      <input 
                        type="checkbox"
                        className="w-4 h-4 rounded border-border text-sky-600 focus:ring-sky-500"
                        checked={(languagesValue || []).includes(lang.value)}
                        onChange={() => toggleLanguage(lang.value)}
                      />
                      <span className="text-sm font-medium">{lang.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Medical Details */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-sky-500" />
                Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    {...register("age", { valueAsNumber: true })}
                  />
                  {errors.age && <p className="text-xs text-red-500">{errors.age.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select defaultValue={user.gender} onValueChange={(val) => setValue("gender", val)}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Male", "Female"].map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodType">Blood Group</Label>
                <Select defaultValue={user.bloodType} onValueChange={(val) => setValue("bloodType", val)}>
                  <SelectTrigger id="bloodType">
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.bloodType && <p className="text-xs text-red-500">{errors.bloodType.message}</p>}
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex items-start gap-3">
                <Mail className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-bold text-amber-900 dark:text-amber-200">Official Communication</p>
                  <p className="text-amber-800 dark:text-amber-300 opacity-80">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">About Your Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="description">Professional Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your expertise and approach to patient care..."
                rows={6}
                {...register("description")}
              />
              {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            className="w-full md:w-64 h-12 bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-500/20"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Updating Profile...
              </>
            ) : (
              "Save Profile Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
