"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UserProfileAvatarProps {
  imageUrl?: string | null;
  username?: string | null;
  points?: number;
  size?: "sm" | "md" | "lg" | "xl";
  showLevel?: boolean;
  className?: string;
}

/**
 * Enhanced avatar component for the gamification system that shows user avatars and optional level indicators
 */
export const UserProfileAvatar = ({
  imageUrl,
  username,
  points = 0,
  size = "md",
  showLevel = false,
  className
}: UserProfileAvatarProps) => {
  // Calculate user level based on points
  const getUserLevel = (points: number) => {
    if (points >= 1000) return 5;
    if (points >= 500) return 4;
    if (points >= 250) return 3;
    if (points >= 100) return 2;
    if (points >= 50) return 1;
    return 0;
  };

  const level = getUserLevel(points);

  // Configure sizes
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-24 w-24"
  };

  // Generate avatar fallback from username
  const generateFallback = () => {
    if (!username) return "U";
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="relative inline-block">
      <Avatar className={cn(sizeClasses[size], "border-2 border-background", className)}>
        <AvatarImage src={imageUrl || undefined} alt={username || "User"} />
        <AvatarFallback>
          {generateFallback()}
        </AvatarFallback>
      </Avatar>
      
      {showLevel && level > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                className={cn(
                  "absolute -bottom-2 -right-2 rounded-full",
                  size === "sm" ? "text-[0.6rem] px-1" : "text-xs px-1.5",
                  level >= 4 ? "bg-yellow-500" : 
                  level >= 3 ? "bg-emerald-500" : 
                  level >= 2 ? "bg-blue-500" : 
                  "bg-indigo-500"
                )}
              >
                {level}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-sm">Level {level}</p>
              <p className="text-xs text-muted-foreground">{points} points</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}; 