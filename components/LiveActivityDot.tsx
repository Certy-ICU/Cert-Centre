"use client";

import { cn } from "@/lib/utils";

interface LiveActivityDotProps {
  active?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LiveActivityDot = ({ 
  active = true, 
  size = "md", 
  className 
}: LiveActivityDotProps) => {
  const getSizeClass = () => {
    switch (size) {
      case "sm": return "w-1.5 h-1.5";
      case "md": return "w-2 h-2";
      case "lg": return "w-3 h-3";
      default: return "w-2 h-2";
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      <div 
        className={cn(
          "rounded-full bg-green-500",
          active ? "animate-pulse" : "",
          getSizeClass(),
          className
        )}
      />
      {active && (
        <div 
          className={cn(
            "absolute rounded-full bg-green-500/30 animate-ping",
            getSizeClass()
          )}
        />
      )}
    </div>
  );
}; 