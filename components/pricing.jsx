"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Check, 
  Video, 
  UserCheck, 
  Compass, 
  ShieldCheck, 
  Sparkles, 
  Smartphone, 
  QrCode, 
  Zap, 
  Coins, 
  Info,
  Heart
} from "lucide-react";
import { buyCreditsSimulated } from "@/actions/credits";
import { toast } from "sonner";

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      id: "basic",
      name: "Basic",
      price: 0,
      credits: 10,
      gradient: "from-slate-900 to-slate-950 dark:from-slate-900/60 dark:to-slate-950/60",
      border: "border-slate-800",
      accent: "text-slate-400 bg-slate-500/10",
      features: [
        "Symptom Checker",
        "Local Doctor Search",
        "Public Health Records",
        "10 Free Monthly Credits"
      ]
    },
    {
      id: "pro",
      name: "Pro",
      price: 499,
      credits: 50,
      gradient: "from-sky-950/80 to-blue-950/90 dark:from-sky-950/30 dark:to-blue-950/30",
      border: "border-sky-500/30 shadow-sky-500/5",
      accent: "text-sky-400 bg-sky-500/10",
      popular: true,
      features: [
        "Everything in Basic",
        "Priority Tele-Consultation",
        "Private Health Vault",
        "24/7 AI Assistant Guidance",
        "50 Monthly Credits"
      ]
    },
    {
      id: "family",
      name: "Family",
      price: 999,
      credits: 150,
      gradient: "from-emerald-950/80 to-teal-950/90 dark:from-emerald-950/30 dark:to-teal-950/30",
      border: "border-emerald-500/30 shadow-emerald-500/5",
      accent: "text-emerald-400 bg-emerald-500/10",
      features: [
        "Up to 4 Linked Family Members",
        "Home Sample Collection Refer",
        "Dedicated Health Manager Alert",
        "Emergency Priority Directives",
        "150 Monthly Credits"
      ]
    }
  ];

  const handleOpenCheckout = (plan) => {
    setSelectedPlan(plan);
    setCheckoutOpen(true);
  };

  const handleSimulatePayment = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      const res = await buyCreditsSimulated(selectedPlan.credits, selectedPlan.id);
      if (res.success) {
        toast.success(`🎉 SUBSCRIPTION COMPLETED! Allocated ${selectedPlan.credits} credits to your account successfully!`);
        setCheckoutOpen(false);
      }
    } catch (err) {
      toast.error("Simulation failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate UPI deep-link URL (Works automatically on smartphones with PhonePe, GPay, Paytm, etc.)
  const upiId = "arnabc512@okaxis"; // Merchant/Developer VPA
  const upiName = "DocSaathi Healthcare";
  const upiUrl = selectedPlan 
    ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${selectedPlan.price}&cu=INR&tn=${encodeURIComponent(`DocSaathi ${selectedPlan.name} Subscription`)}`
    : "";

  // Dynamic QR Code API (Totally free dynamic alternative)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-2">
      
      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`flex flex-col justify-between border-2 rounded-[2rem] overflow-hidden bg-gradient-to-br ${plan.gradient} ${plan.border} transition-all duration-300 hover:scale-[1.02] relative`}
          >
            {plan.popular && (
              <div className="absolute top-4 right-4 bg-sky-500 text-white font-extrabold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full animate-pulse shadow-sm shadow-sky-500/10">
                Most Popular
              </div>
            )}
            
            <CardHeader className="p-6 pb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${plan.accent} w-fit`}>
                {plan.name} Package
              </span>
              <div className="flex items-baseline mt-4 gap-1">
                <span className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">₹{plan.price}</span>
                <span className="text-muted-foreground text-xs font-semibold">/month</span>
              </div>
              <CardDescription className="text-muted-foreground text-xs font-medium mt-1">
                Allocates {plan.credits} consultation credits immediately.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-4 flex-1">
              <div className="h-px bg-border/60 w-full" />
              <ul className="space-y-3 text-xs leading-relaxed text-foreground/80 font-medium">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="p-6 pt-2">
              <Button 
                onClick={() => handleOpenCheckout(plan)}
                className={`w-full h-11 font-extrabold rounded-2xl cursor-pointer transition-all hover:shadow-lg ${
                  plan.popular 
                    ? "bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/10" 
                    : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-950 dark:hover:bg-slate-900 border border-border"
                }`}
              >
                {plan.price === 0 ? "Activate Free Credits" : `Subscribe for ₹${plan.price}`}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Free UPI Alternative Banner Alert */}
      <div className="p-4 sm:p-5 bg-sky-500/5 border border-sky-500/20 rounded-3xl text-[11px] sm:text-xs text-sky-800 dark:text-sky-300 flex flex-col sm:flex-row gap-4 items-start leading-relaxed relative overflow-hidden">
        <Sparkles className="w-5 h-5 text-sky-500 shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1">
          <h5 className="font-extrabold text-sky-900 dark:text-sky-200">Zero-Fee Frictionless UPI payment Integration</h5>
          <p>
            To completely bypass expensive payment gateway fees (Razorpay, Stripe) and avoid complex commercial registrations, we integrate **UPI dynamic deep-linking QR codes**! This is 100% free, direct-to-bank, and works on all smartphones in India.
          </p>
        </div>
      </div>

      {/* UPI Checkout Modal */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md border-sky-500/20 bg-background shadow-2xl rounded-3xl overflow-hidden p-6 z-[999]">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <Coins className="w-5 h-5 text-sky-500 animate-pulse" />
              UPI Secure Sandbox Checkout
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure your subscription for the {selectedPlan?.name} package.
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-5 pt-2">
              
              {/* Transaction Summary */}
              <div className="p-4 bg-muted/40 border border-border/60 rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-foreground">{selectedPlan.name} Subscription</h4>
                  <p className="text-[10px] text-muted-foreground">Will allocate {selectedPlan.credits} credits immediately</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-foreground">₹{selectedPlan.price}</span>
                  <p className="text-[9px] text-muted-foreground">Direct VPA payment</p>
                </div>
              </div>

              {selectedPlan.price === 0 ? (
                /* Free Plan Activation */
                <div className="space-y-4 text-center py-4">
                  <Heart className="w-12 h-12 text-rose-500 mx-auto animate-pulse" />
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    Activate your 10 free monthly credits directly to start booking tele-consultations immediately!
                  </p>
                  <Button
                    onClick={handleSimulatePayment}
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold h-12 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer"
                  >
                    Activate Basic Credits
                  </Button>
                </div>
              ) : (
                /* UPI Payment Flow */
                <div className="space-y-4">
                  
                  {/* Smartphone View: Deep Link Button */}
                  <div className="block sm:hidden space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <Smartphone className="w-3.5 h-3.5" /> Mobile Quick Pay
                    </div>
                    <a 
                      href={upiUrl}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl h-12 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
                    >
                      🚀 Open UPI App to Pay ₹{selectedPlan.price}
                    </a>
                    <p className="text-[9px] text-muted-foreground text-center">
                      Instantly opens PhonePe, Google Pay, GPay, Paytm, or BHIM.
                    </p>
                  </div>

                  {/* Desktop View: Scan Dynamic QR */}
                  <div className="hidden sm:flex flex-col items-center gap-3 py-2 border-2 border-dashed border-border/80 rounded-2xl bg-slate-50/30 dark:bg-black/10">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <QrCode className="w-3.5 h-3.5" /> Dynamic UPI QR Code
                    </div>
                    
                    {/* Dynamic QR Code Render */}
                    <img 
                      src={qrCodeUrl} 
                      alt="UPI Dynamic Pay QR Code"
                      className="w-48 h-48 border border-border shadow-md rounded-xl bg-white p-1"
                    />
                    
                    <p className="text-[10px] text-muted-foreground max-w-xs text-center leading-relaxed">
                      Scan this dynamically generated QR using any bank app (PhonePe, GPay, Paytm) to prepopulate ₹{selectedPlan.price} pre-filled.
                    </p>
                  </div>

                  {/* Sandbox Simulated Auto-Bypass Button */}
                  <div className="space-y-2 pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-amber-500 tracking-wider">
                      <Zap className="w-3.5 h-3.5 animate-pulse" /> Sandbox Simulator Bypass
                    </div>
                    <Button 
                      onClick={handleSimulatePayment}
                      disabled={loading}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold h-12 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer animate-in fade-in duration-300"
                    >
                      {loading ? "Allocating Credits..." : `Simulate Instant UPI Payment Success`}
                    </Button>
                    <p className="text-[9px] text-muted-foreground text-center">
                      For rapid evaluation: clicks simulate a successful scan verification to write the {selectedPlan.credits} credits to the database.
                    </p>
                  </div>

                </div>
              )}

            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
