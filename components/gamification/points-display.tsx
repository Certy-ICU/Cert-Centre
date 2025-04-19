import { Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface PointsDisplayProps {
  points: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const PointsDisplay = ({
  points,
  size = "md",
  className
}: PointsDisplayProps) => {
  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  return (
    <div className={cn(
      "flex items-center gap-2 font-medium",
      sizes[size],
      className
    )}>
      <Award className={cn(
        "text-yellow-500", 
        size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-6 h-6"
      )} />
      <span>{points} points</span>
    </div>
  );
}; 