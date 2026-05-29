import React from "react";
import SOSButton from "@/components/sos-button";
import { AccessibilityProvider } from "@/lib/accessibility-context";

const MainLayout = ({ children }) => {
  return (
    <AccessibilityProvider>
      <div className="container mx-auto mt-4 sm:mt-6 mb-20">
        {children}
        <SOSButton />
      </div>
    </AccessibilityProvider>
  );
};

export default MainLayout;
