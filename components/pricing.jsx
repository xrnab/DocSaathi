"use client";

import React from "react";
import { Card, CardContent } from "./ui/card";
import { ThemeAwarePricingTable } from "./clerk-elements";

const Pricing = () => {
  return (
    <Card className="border-sky-500/30 shadow-lg bg-gradient-to-b from-sky-500/10 to-transparent backdrop-blur-sm rounded-[1.5rem] sm:rounded-[2rem]">
      <CardContent className="p-3 sm:p-6 md:p-8">
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
