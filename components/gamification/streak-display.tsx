"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  size?: "sm" | "md" | "lg";
  showCard?: boolean;
  nextMilestone?: number;
  className?: string;
}

export const StreakDisplay = ({
  currentStreak, 
  longestStreak,
  size = "md",
  showCard = false,
  nextMilestone,
  className
}: StreakDisplayProps) => {
  const fontSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };
  
  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  // Calculate next milestone (3, 7, or 30 days)
  const getNextMilestone = () => {
    if (!nextMilestone) {
      if (currentStreak < 3) return 3;
      if (currentStreak < 7) return 7;
      if (currentStreak < 30) return 30;
      return currentStreak + 5;
    }
    return nextMilestone;
  };
  
  const nextGoal = getNextMilestone();
  const progress = Math.min(Math.round((currentStreak / nextGoal) * 100), 100);
  
  const StreakContent = (
    <div className={cn("flex flex-col space-y-2", className)}>
      <div className="flex items-center gap-2">
        <div className={cn(
          "flex items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950 p-1.5", 
          size === "lg" ? "p-2" : size === "sm" ? "p-1" : "p-1.5"
        )}>
          <Flame className={cn("text-orange-500", iconSizes[size])} />
        </div>
        <span className={cn("font-medium", fontSizes[size])}>
          {currentStreak} day streak
        </span>
      </div>
      
      {size !== "sm" && (
        <>
          <p className={cn("text-muted-foreground", size === "lg" ? "text-sm" : "text-xs")}>
            Longest streak: {longestStreak} days
          </p>
          
          {nextGoal && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Next milestone</span>
                <span>{currentStreak}/{nextGoal} days</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}
        </>
      )}
    </div>
  );
  
  if (showCard) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          {StreakContent}
        </CardContent>
      </Card>
    );
  }
  
  return StreakContent;
}; 