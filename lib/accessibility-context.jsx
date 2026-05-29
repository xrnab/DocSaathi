"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AccessibilityContext = createContext({
  enabled: false,
  toggle: () => {},
});

export function AccessibilityProvider({ children }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("docsaathi-accessibility");
    if (stored === "true") {
      setEnabled(true);
      document.documentElement.classList.add("accessibility-mode");
    }
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem("docsaathi-accessibility", String(next));
    if (next) {
      document.documentElement.classList.add("accessibility-mode");
    } else {
      document.documentElement.classList.remove("accessibility-mode");
    }
  };

  return (
    <AccessibilityContext.Provider value={{ enabled, toggle }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = () => useContext(AccessibilityContext);
