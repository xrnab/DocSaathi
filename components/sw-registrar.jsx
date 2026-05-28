"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registered successfully with scope:", registration.scope);

        // Listen for messages from the service worker
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data && event.data.type === "BACKGROUND_SYNC_TRIGGERED") {
            console.log("SW Registrar: Background sync triggered from SW. Dispatching online event.");
            window.dispatchEvent(new Event("online"));
          }
        });

        // Register background sync tag if supported by the browser
        if ("sync" in registration) {
          registration.sync.register("docsaathi-sync")
            .then(() => console.log("SW Registrar: Background sync tag 'docsaathi-sync' registered successfully."))
            .catch((err) => console.error("SW Registrar: Failed to register sync tag:", err));
        }
      })
      .catch((err) => {
        console.error("SW Registrar: Service Worker registration failed:", err);
      });
  }, []);

  return null;
}
