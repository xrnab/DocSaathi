"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, User, Medal, FileText, ExternalLink, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { updateDoctorStatus } from "@/actions/admin";
import useFetch from "@/hooks/use-fetch";
import { BarLoader } from "react-spinners";
import { toast } from "sonner";
import { formatDoctorName } from "@/lib/utils";

export function PendingDoctors({ doctors }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const router = useRouter();

  const {
    loading,
    data,
    fn: submitStatusUpdate,
  } = useFetch(updateDoctorStatus);

  const filteredDoctors = doctors.filter((doctor) => {
    const query = searchTerm.toLowerCase();
    return (
      doctor.name?.toLowerCase().includes(query) ||
      doctor.specialty?.toLowerCase().includes(query) ||
      doctor.email?.toLowerCase().includes(query)
    );
  });

  const handleViewDetails = (doctor) => setSelectedDoctor(doctor);
  const handleCloseDialog = () => setSelectedDoctor(null);

  const handleUpdateStatus = async (doctorId, status) => {
    if (loading) return;
    const formData = new FormData();
    formData.append("doctorId", doctorId);
    formData.append("status", status);
    await submitStatusUpdate(formData);
  };

  useEffect(() => {
    if (data?.success) {
      toast.success("Doctor status updated successfully!");
      handleCloseDialog();
      router.refresh(); // Re-fetch server data to remove doctor from pending list
    }
  }, [data]);

  return (
    <div>
      <Card className="border-sky-200 dark:border-sky-900/30 bg-card">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-foreground">
                  Pending Doctor Verifications
                </CardTitle>
                <CardDescription className="text-muted-foreground mt-0.5">
                  Review and approve applications before they go live
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search applicants..."
                  className="pl-9 bg-background border-border focus-visible:ring-sky-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 shrink-0">
                {doctors.length} Total
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {filteredDoctors.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-sky-50 dark:bg-sky-900/20 p-4 rounded-full inline-flex mb-4">
                {searchTerm ? <Search className="h-8 w-8 text-sky-500" /> : <Check className="h-8 w-8 text-sky-500" />}
              </div>
              <p className="text-foreground font-medium">
                {searchTerm ? "No applicants match your search." : "All caught up!"}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {searchTerm ? "Try a different search term." : "No pending verification requests at this time."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDoctors.map((doctor) => (
                <Card
                  key={doctor.id}
                  className="border-border hover:border-sky-300 dark:hover:border-sky-700 transition-all bg-background shadow-sm"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-full p-2.5 shrink-0 border border-sky-100 dark:border-sky-800">
                          <User className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {formatDoctorName(doctor.name)}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {doctor.specialty} &bull; {doctor.experience} yrs experience
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{doctor.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <Badge
                          variant="outline"
                          className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                        >
                          Pending
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(doctor)}
                          className="border-sky-300 dark:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-900/20 text-sky-700 dark:text-sky-300"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Doctor Details Dialog */}
      {selectedDoctor && (
        <Dialog open={!!selectedDoctor} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-2xl bg-background border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">
                Doctor Verification Details
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Review the doctor&apos;s information carefully before making a decision
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Full Name", value: selectedDoctor.name },
                  { label: "Email", value: selectedDoctor.email },
                  { label: "Applied On", value: format(new Date(selectedDoctor.createdAt), "PPP") },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/40 rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-sm font-semibold text-foreground break-all">{value}</p>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Professional Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Medal className="h-4 w-4 text-sky-500" />
                  <h3 className="font-semibold text-foreground">Professional Information</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-muted/40 rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Specialty</p>
                    <p className="text-sm font-semibold text-foreground">{selectedDoctor.specialty}</p>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Experience</p>
                    <p className="text-sm font-semibold text-foreground">{selectedDoctor.experience} years</p>
                  </div>
                  <div className="bg-muted/40 rounded-lg p-3 sm:col-span-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Credentials Document</p>
                    <a
                      href={selectedDoctor.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center gap-1.5 text-sm font-medium"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Credential Document
                    </a>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-sky-500" />
                  <h3 className="font-semibold text-foreground">Service Description</h3>
                </div>
                <p className="text-muted-foreground text-sm whitespace-pre-line bg-muted/40 rounded-lg p-3">
                  {selectedDoctor.description || "No description provided."}
                </p>
              </div>
            </div>

            {loading && <BarLoader width={"100%"} color="#0ea5e9" />}

            <DialogFooter className="flex sm:justify-between gap-3 pt-2">
              <Button
                variant="destructive"
                onClick={() => handleUpdateStatus(selectedDoctor.id, "REJECTED")}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white flex-1 sm:flex-none"
              >
                <X className="mr-2 h-4 w-4" />
                Reject Application
              </Button>
              <Button
                onClick={() => handleUpdateStatus(selectedDoctor.id, "VERIFIED")}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-none"
              >
                <Check className="mr-2 h-4 w-4" />
                Approve & Verify
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
