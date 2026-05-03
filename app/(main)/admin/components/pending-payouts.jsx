"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Check,
  User,
  DollarSign,
  Mail,
  Stethoscope,
  Loader2,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { approvePayout } from "@/actions/admin";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { BarLoader } from "react-spinners";
import { formatDoctorName } from "@/lib/utils";

export function PendingPayouts({ payouts }) {
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);

  const { loading, data, fn: submitApproval } = useFetch(approvePayout);

  const handleViewDetails = (payout) => setSelectedPayout(payout);
  const handleApprovePayout = (payout) => {
    setSelectedPayout(payout);
    setShowApproveDialog(true);
  };

  const confirmApproval = async () => {
    if (!selectedPayout || loading) return;
    const formData = new FormData();
    formData.append("payoutId", selectedPayout.id);
    await submitApproval(formData);
  };

  useEffect(() => {
    if (data?.success) {
      setShowApproveDialog(false);
      setSelectedPayout(null);
      toast.success("Payout approved successfully!");
    }
  }, [data]);

  const closeDialogs = () => {
    setSelectedPayout(null);
    setShowApproveDialog(false);
  };

  return (
    <div>
      <Card className="border-sky-200 dark:border-sky-900/30 bg-card">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30">
              <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-foreground">
                Pending Payouts
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-0.5">
                Review and approve doctor payout requests
              </CardDescription>
            </div>
            <Badge className="ml-auto bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
              {payouts.length} Pending
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {payouts.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-full inline-flex mb-4">
                <Check className="h-8 w-8 text-emerald-500" />
              </div>
              <p className="text-foreground font-medium">All payouts processed!</p>
              <p className="text-muted-foreground text-sm mt-1">No pending payout requests at this time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payouts.map((payout) => (
                <Card
                  key={payout.id}
                  className="border-border hover:border-sky-300 dark:hover:border-sky-700 transition-all bg-background shadow-sm"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-full p-2.5 shrink-0 mt-0.5 border border-sky-100 dark:border-sky-800">
                          <User className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {formatDoctorName(payout.doctor.name)}
                          </h3>
                          <p className="text-sm text-muted-foreground">{payout.doctor.specialty}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="font-medium text-foreground">
                                ${payout.netAmount.toFixed(2)}
                              </span>
                              <span>({payout.credits} credits)</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5 text-sky-500" />
                              <span className="text-xs">{payout.paypalEmail}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Requested {format(new Date(payout.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                        <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                          Pending
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(payout)}
                          className="border-sky-200 dark:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-900/20 text-sky-700 dark:text-sky-300"
                        >
                          Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprovePayout(payout)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Check className="h-4 w-4 mr-1.5" />
                          Approve
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

      {/* Payout Details Dialog */}
      {selectedPayout && !showApproveDialog && (
        <Dialog open={!!selectedPayout} onOpenChange={closeDialogs}>
          <DialogContent className="max-w-lg bg-background border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">
                Payout Request Details
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Review the payout request information
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Doctor Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-sky-500" />
                  <h3 className="font-semibold text-foreground text-sm">Doctor Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Name", value: `Dr. ${selectedPayout.doctor.name}` },
                    { label: "Email", value: selectedPayout.doctor.email },
                    { label: "Specialty", value: selectedPayout.doctor.specialty },
                    { label: "Current Credits", value: selectedPayout.doctor.credits },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                      <p className="text-sm font-semibold text-foreground break-all">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payout Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  <h3 className="font-semibold text-foreground text-sm">Payout Breakdown</h3>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credits to pay out:</span>
                    <span className="font-medium text-foreground">{selectedPayout.credits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gross amount:</span>
                    <span className="text-foreground">${selectedPayout.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform fee:</span>
                    <span className="text-red-600 dark:text-red-400">-${selectedPayout.platformFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-semibold">
                    <span className="text-foreground">Net payout:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">${selectedPayout.netAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-2">
                    <p className="text-xs text-muted-foreground mb-0.5">PayPal</p>
                    <p className="font-medium text-foreground">{selectedPayout.paypalEmail}</p>
                  </div>
                </div>
              </div>

              {selectedPayout.doctor.credits < selectedPayout.credits && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Warning: Doctor has only {selectedPayout.doctor.credits} credits but this payout requires {selectedPayout.credits}.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={closeDialogs} className="border-border">
                Close
              </Button>
              <Button
                onClick={() => handleApprovePayout(selectedPayout)}
                disabled={selectedPayout.doctor.credits < selectedPayout.credits}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Check className="h-4 w-4 mr-1.5" />
                Approve Payout
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Dialog */}
      {showApproveDialog && selectedPayout && (
        <Dialog open={showApproveDialog} onOpenChange={() => setShowApproveDialog(false)}>
          <DialogContent className="bg-background border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">
                Confirm Payout Approval
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will deduct <strong>{selectedPayout.credits}</strong> credits from Dr. {selectedPayout.doctor.name}&apos;s account and mark the payout as processed.
                </AlertDescription>
              </Alert>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                {[
                  { label: "Doctor", value: `Dr. ${selectedPayout.doctor.name}` },
                  { label: "Amount to pay", value: `$${selectedPayout.netAmount.toFixed(2)}`, highlight: true },
                  { label: "PayPal", value: selectedPayout.paypalEmail },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}:</span>
                    <span className={highlight ? "font-semibold text-emerald-600 dark:text-emerald-400" : "font-medium text-foreground"}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {loading && <BarLoader width={"100%"} color="#0ea5e9" />}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowApproveDialog(false)}
                disabled={loading}
                className="border-border"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmApproval}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Confirm Approval
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
