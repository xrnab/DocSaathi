"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  Calendar,
  BarChart3,
  CreditCard,
  Loader2,
  AlertCircle,
  Coins,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { requestAshaPayout } from "@/actions/payout";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

const statCards = [
  {
    key: "credits",
    label: "Available Credits",
    icon: Coins,
    color: "sky",
  },
  {
    key: "month",
    label: "This Month",
    icon: TrendingUp,
    color: "emerald",
  },
  {
    key: "total",
    label: "Completed Proxy Appointments",
    icon: Calendar,
    color: "blue",
  },
  {
    key: "avg",
    label: "Avg / Month",
    icon: BarChart3,
    color: "purple",
  },
];

export function AshaEarnings({ earnings, payouts = [] }) {
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");

  const {
    thisMonthEarnings = 0,
    completedAppointments = 0,
    averageEarningsPerMonth = 0,
    availableCredits = 0,
    availablePayout = 0,
  } = earnings;

  const { loading, data, fn: submitPayoutRequest } = useFetch(requestAshaPayout);

  const pendingPayout = payouts.find((p) => p.status === "PROCESSING");

  const handlePayoutRequest = async (e) => {
    e.preventDefault();
    if (!upiId) {
      toast.error("UPI ID is required");
      return;
    }
    if (!upiId.includes("@")) {
      toast.error("UPI ID must contain '@' symbol");
      return;
    }
    const formData = new FormData();
    formData.append("upiId", upiId);
    if (accountNumber) formData.append("accountNumber", accountNumber);
    if (ifscCode) formData.append("ifscCode", ifscCode);
    await submitPayoutRequest(formData);
  };

  useEffect(() => {
    if (data?.success) {
      setShowPayoutDialog(false);
      setUpiId("");
      setAccountNumber("");
      setIfscCode("");
      toast.success("Payout request submitted successfully!");
      // We can also trigger a window reload or route refresh for local sync representation
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  }, [data]);

  const platformFee = availableCredits * 100; // ₹100 platform fee for ASHA

  const statValues = [
    { value: availableCredits, sub: `₹${availablePayout.toFixed(2)} available for payout` },
    { value: `₹${thisMonthEarnings.toFixed(2)}` },
    { value: completedAppointments, sub: "completed" },
    { value: `₹${averageEarningsPerMonth.toFixed(2)}` },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" suppressHydrationWarning>
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={card.key} className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{card.label}</p>
                    <p className="text-3xl font-extrabold text-foreground mt-1.5">
                      {statValues[i].value}
                    </p>
                    {statValues[i].sub && (
                      <p className="text-xs text-muted-foreground mt-1 font-medium">{statValues[i].sub}</p>
                    )}
                  </div>
                  <div className="bg-sky-50 dark:bg-sky-900/20 p-3 rounded-full border border-sky-100 dark:border-sky-850">
                    <Icon className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payout Management */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-sky-500" />
            Payout Management
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Status Box */}
          <div className="bg-muted/40 rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">Available for Payout</h3>
              <Badge
                variant="outline"
                className={pendingPayout
                  ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                  : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                }
              >
                {pendingPayout ? "PROCESSING" : "Available"}
              </Badge>
            </div>

            {pendingPayout ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  {[
                    { label: "Pending Credits", value: pendingPayout.credits },
                    { label: "Pending Amount", value: `₹${pendingPayout.netAmount.toFixed(2)}` },
                    { label: "UPI ID", value: pendingPayout.upiId },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-background rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                      <p className="font-semibold text-foreground text-sm break-all">{value}</p>
                    </div>
                  ))}
                  {pendingPayout.accountNumber && (
                    <div className="bg-background rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground mb-0.5">Bank Account</p>
                      <p className="font-semibold text-foreground text-sm break-all">{pendingPayout.accountNumber}</p>
                    </div>
                  )}
                  {pendingPayout.ifscCode && (
                    <div className="bg-background rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground mb-0.5">IFSC Code</p>
                      <p className="font-semibold text-foreground text-sm break-all uppercase">{pendingPayout.ifscCode}</p>
                    </div>
                  )}
                </div>
                <Alert className="bg-amber-500/5 border-amber-500/20 text-amber-800 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-sm font-medium">
                    Your payout request is being processed. Government credits will be deducted after admin approves it.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  {[
                    { label: "Available Credits", value: availableCredits },
                    { label: "Payout Amount", value: `₹${availablePayout.toFixed(2)}` },
                    { label: "Platform Fee", value: `₹${platformFee.toFixed(2)}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-background rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                      <p className="font-semibold text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
                {availableCredits > 0 ? (
                  <Button
                    onClick={() => setShowPayoutDialog(true)}
                    className="w-full mt-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    Request Payout for All Credits
                  </Button>
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-2">
                    No credits available. Help register families and book proxy doctor visits to earn credits.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Info Alert */}
          <Alert className="bg-sky-50 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/30">
            <AlertCircle className="h-4 w-4 text-sky-500" />
            <AlertDescription className="text-sm text-muted-foreground">
              <strong className="text-foreground">ASHA Payout Structure:</strong> You earn <strong className="text-emerald-600 dark:text-emerald-400">₹400</strong> per credit. The administrative platform fee is ₹100 per credit. Payouts are processed via UPI ID or direct bank transfer.
            </AlertDescription>
          </Alert>

          {/* Payout History */}
          {payouts.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border/80">
              <h3 className="text-base font-semibold text-foreground">Payout History</h3>
              <div className="space-y-2">
                {payouts.slice(0, 5).map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-foreground">
                        {format(new Date(payout.createdAt), "MMMM d, yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <strong className="text-foreground">{payout.credits} Credits</strong> &bull; ₹{payout.netAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">UPI: {payout.upiId}</p>
                      {payout.accountNumber && (
                        <p className="text-xs text-muted-foreground">Bank: {payout.accountNumber} ({payout.ifscCode})</p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={payout.status === "PROCESSED"
                        ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-semibold"
                        : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 font-semibold"
                      }
                    >
                      {payout.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Request Dialog */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent className="bg-background border-border max-w-md rounded-2xl">
          <DialogHeader suppressHydrationWarning>
            <DialogTitle className="text-xl font-bold text-foreground">
              Request Payout
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Submit your bank details to redeem your government ASHA credits.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePayoutRequest} className="space-y-4">
            <div className="bg-muted/40 rounded-xl border border-border p-4 space-y-2 text-sm">
              {[
                { label: "Available credits", value: availableCredits },
                { label: "Gross value", value: `₹${(availableCredits * 500).toFixed(2)}` },
                { label: "Platform administrative fee", value: `-₹${platformFee.toFixed(2)}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}:</span>
                  <span className="text-foreground font-semibold">{value}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 flex justify-between font-bold text-sm">
                <span className="text-foreground">Net payout to you:</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-base">₹{availablePayout.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="upiId" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">UPI ID *</Label>
                <Input
                  id="upiId"
                  required
                  placeholder="e.g. mobile@ybl or name@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="rounded-xl bg-slate-50/50 dark:bg-slate-900/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="accountNumber" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bank Account (Optional)</Label>
                  <Input
                    id="accountNumber"
                    placeholder="Account Number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="rounded-xl bg-slate-50/50 dark:bg-slate-900/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ifscCode" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">IFSC Code (Optional)</Label>
                  <Input
                    id="ifscCode"
                    placeholder="IFSC Code"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    className="rounded-xl bg-slate-50/50 dark:bg-slate-900/30 uppercase"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPayoutDialog(false)}
                disabled={loading}
                className="border-border rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
