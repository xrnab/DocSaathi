"use client";

import React from "react";
import { Card, CardContent } from "./ui/card";
import { ThemeAwarePricingTable } from "./clerk-elements";

const Pricing = () => {
  return (
    <Card className="border-sky-500/30 shadow-lg bg-gradient-to-b from-sky-500/10 to-transparent backdrop-blur-sm">
      <CardContent className="p-6 md:p-8">
        <ThemeAwarePricingTable
          checkoutProps={{
            appearance: {
              elements: {
                drawerRoot: {
                  zIndex: 2000,
                },
              },
            },
          }}
        />
      </CardContent>
    </Card>
  );
};

export default Pricing;
