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
import { requestPayout } from "@/actions/payout";
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
    label: "Total Appointments",
    icon: Calendar,
    color: "blue",
  },
  {
    key: "avg",
    label: "Avg / Month",
    icon: BarChart3,
    color: "violet",
  },
];

export function DoctorEarnings({ earnings, payouts = [] }) {
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState("");

  const {
    thisMonthEarnings = 0,
    completedAppointments = 0,
    averageEarningsPerMonth = 0,
    availableCredits = 0,
    availablePayout = 0,
  } = earnings;

  const { loading, data, fn: submitPayoutRequest } = useFetch(requestPayout);

  const pendingPayout = payouts.find((p) => p.status === "PROCESSING");

  const handlePayoutRequest = async (e) => {
    e.preventDefault();
    if (!paypalEmail) { toast.error("PayPal email is required"); return; }
    const formData = new FormData();
    formData.append("paypalEmail", paypalEmail);
    await submitPayoutRequest(formData);
  };

  useEffect(() => {
    if (data?.success) {
      setShowPayoutDialog(false);
      setPaypalEmail("");
      toast.success("Payout request submitted successfully!");
    }
  }, [data]);

  const platformFee = availableCredits * 2;

  const statValues = [
    { value: availableCredits, sub: `$${availablePayout.toFixed(2)} available for payout` },
    { value: `$${thisMonthEarnings.toFixed(2)}` },
    { value: completedAppointments, sub: "completed" },
    { value: `$${averageEarningsPerMonth.toFixed(2)}` },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={card.key} className="border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">
                      {statValues[i].value}
                    </p>
                    {statValues[i].sub && (
                      <p className="text-xs text-muted-foreground mt-1">{statValues[i].sub}</p>
                    )}
                  </div>
                  <div className="bg-sky-50 dark:bg-sky-900/20 p-3 rounded-full border border-sky-100 dark:border-sky-800/30">
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
                    { label: "Pending Amount", value: `$${pendingPayout.netAmount.toFixed(2)}` },
                    { label: "PayPal Email", value: pendingPayout.paypalEmail },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-background rounded-lg p-3 border border-border">
                      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                      <p className="font-semibold text-foreground text-sm break-all">{value}</p>
                    </div>
                  ))}
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Your payout request is being processed. Credits will be deducted after admin approves it.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  {[
                    { label: "Available Credits", value: availableCredits },
                    { label: "Payout Amount", value: `$${availablePayout.toFixed(2)}` },
                    { label: "Platform Fee", value: `$${platformFee.toFixed(2)}` },
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
                    className="w-full mt-2 bg-sky-600 hover:bg-sky-700 text-white"
                  >
                    Request Payout for All Credits
                  </Button>
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-2">
                    No credits available. Complete more appointments to earn credits.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Payout Structure:</strong> You earn $8 per credit. Platform fee is $2 per credit. Payouts are processed via PayPal.
            </AlertDescription>
          </Alert>

          {/* Payout History */}
          {payouts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">Payout History</h3>
              <div className="space-y-2">
                {payouts.slice(0, 5).map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {format(new Date(payout.createdAt), "MMM d, yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payout.credits} credits &bull; ${payout.netAmount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">{payout.paypalEmail}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={payout.status === "PROCESSED"
                        ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                        : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
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
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              Request Payout
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Request payout for all your available credits
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePayoutRequest} className="space-y-4">
            <div className="bg-muted/40 rounded-xl border border-border p-4 space-y-2 text-sm">
              {[
                { label: "Available credits", value: availableCredits },
                { label: "Gross amount", value: `$${(availableCredits * 10).toFixed(2)}` },
                { label: "Platform fee (20%)", value: `-$${platformFee.toFixed(2)}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}:</span>
                  <span className="text-foreground font-medium">{value}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 flex justify-between font-semibold">
                <span className="text-foreground">Net payout:</span>
                <span className="text-emerald-600 dark:text-emerald-400">${availablePayout.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paypalEmail" className="text-foreground">PayPal Email</Label>
              <Input
                id="paypalEmail"
                type="email"
                placeholder="your-email@paypal.com"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                className="bg-background border-border focus-visible:ring-sky-500"
                required
              />
              <p className="text-sm text-muted-foreground">
                Enter the PayPal email where you want to receive the payout.
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Once processed, {availableCredits} credits will be deducted and ${availablePayout.toFixed(2)} will be sent to your PayPal.
              </AlertDescription>
            </Alert>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPayoutDialog(false)}
                disabled={loading}
                className="border-border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-sky-600 hover:bg-sky-700 text-white"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Requesting...</>
                ) : (
                  "Request Payout"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
