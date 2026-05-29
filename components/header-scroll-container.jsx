"use client";

import React, { useState, useRef } from "react";

export default function HeaderScrollContainer({ children }) {
  const [isScrolling, setIsScrolling] = useState(false);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    isScrollingRef.current = false;
  };

  const handleTouchMove = (e) => {
    if (isScrollingRef.current) return;
    const touch = e.touches[0];
    const diffX = Math.abs(touch.clientX - touchStartRef.current.x);
    const diffY = Math.abs(touch.clientY - touchStartRef.current.y);

    // If drag is horizontal and exceeds 8px, it is recognized as scroll, not click
    if (diffX > 8 && diffX > diffY) {
      isScrollingRef.current = true;
      setIsScrolling(true);
    }
  };

  const handleTouchEnd = () => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    // Briefly hold the scrolling state to swallow any delayed click events
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      isScrollingRef.current = false;
    }, 120);
  };

  const handleScroll = () => {
    if (!isScrollingRef.current) {
      setIsScrolling(true);
    }
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    // Stop scrolling state after 150ms of inactivity
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      isScrollingRef.current = false;
    }, 150);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onScroll={handleScroll}
      className={`flex items-center justify-start lg:justify-end space-x-1.5 sm:space-x-2 overflow-x-auto no-scrollbar whitespace-nowrap flex-1 min-w-0 sm:flex-initial sm:max-w-none shrink-0 scroll-smooth pb-0.5 ${
        isScrolling ? "is-scrolling" : ""
      }`}
    >
      {children}
    </div>
  );
}
