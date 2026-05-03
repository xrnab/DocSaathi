"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function PageProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const prevPath = useRef(pathname + searchParams.toString());

  const startProgress = useCallback(() => {
    setIsLoading(true);
    setProgress(5);

    let current = 5;
    intervalRef.current = setInterval(() => {
      // Increment progressively slower as it approaches 90%
      const remaining = 90 - current;
      const increment = Math.max(0.5, remaining * 0.08);
      current = Math.min(90, current + increment);
      setProgress(current);
    }, 150);
  }, []);

  const finishProgress = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setProgress(100);
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
    }, 300);
  }, []);

  useEffect(() => {
    const currentPath = pathname + searchParams.toString();
    if (currentPath !== prevPath.current) {
      // Route changed — trigger finish immediately
      prevPath.current = currentPath;
      finishProgress();
    }
  }, [pathname, searchParams, finishProgress]);

  // Intercept link clicks to start progress
  useEffect(() => {
    const handleClick = (e) => {
      const anchor = e.target.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;

      // Only trigger for internal navigation (not external, not hash-only, not download)
      const isInternal =
        !anchor.target &&
        !anchor.download &&
        href.startsWith("/") &&
        !href.startsWith("//");

      if (isInternal && href !== window.location.pathname + window.location.search) {
        startProgress();
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [startProgress]);

  // Also listen for form submissions
  useEffect(() => {
    const handleSubmit = () => startProgress();
    document.addEventListener("submit", handleSubmit, true);
    return () => document.removeEventListener("submit", handleSubmit, true);
  }, [startProgress]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!isLoading && progress === 0) return null;

  return (
    <>
      {/* Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none"
        style={{ transition: "opacity 0.3s ease" }}
        aria-hidden="true"
      >
        <div
          className="h-full bg-gradient-to-r from-sky-400 via-blue-500 to-sky-400 shadow-[0_0_8px_2px_rgba(14,165,233,0.6)]"
          style={{
            width: `${progress}%`,
            transition:
              progress === 100
                ? "width 0.2s ease-out, opacity 0.3s ease"
                : "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            opacity: isLoading || progress < 100 ? 1 : 0,
          }}
        />
      </div>

      {/* Subtle loading overlay — just a tiny spinner in the corner */}
      {isLoading && progress < 95 && (
        <div
          className="fixed top-5 right-5 z-[9998] pointer-events-none"
          style={{ opacity: 0.7 }}
          aria-label="Loading page…"
          role="status"
        >
          <svg
            className="animate-spin h-4 w-4 text-sky-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      )}
    </>
  );
}
