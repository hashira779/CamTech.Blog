"use client";

import React, { useEffect, useState } from "react";

export default function TravelTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative w-full">
      {/* Dynamic Route Switching Progress Indicator Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-[2.5px] z-50 bg-gradient-to-r from-teal-500 via-amber-400 to-teal-500 pointer-events-none transition-transform duration-500 ease-out"
        style={{
          transformOrigin: "left",
          animation: "page-progress 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        }}
      />

      {/* Animated Page Content Wrapper */}
      <div className={`transition-all duration-300 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
        {children}
      </div>
    </div>
  );
}
