import React from "react";
import SOSButton from "@/components/sos-button";

const MainLayout = ({ children }) => {
  return (
    <div className="container mx-auto mt-4 sm:mt-6 mb-20">
      {children}
      <SOSButton />
    </div>
  );
};

export default MainLayout;
