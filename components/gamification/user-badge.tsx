"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Share2, Lock, Award, BookOpen, MessageSquare, Zap, Flame } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { BadgeShare } from './badge-share';
import { cva, type VariantProps } from "class-variance-authority";

export interface Badge {
  id: string;
  name: string;
  iconUrl: string;
  description?: string;
  tier?: 'bronze' | 'silver' | 'gold';
  earned?: boolean;
  earnedDate?: Date;
}

const badgeVariants = cva(
  "relative inline-flex items-center justify-center rounded-full overflow-hidden",
  {
    variants: {
      size: {
        xs: "w-5 h-5",
        sm: "w-7 h-7",
        md: "w-10 h-10",
        lg: "w-14 h-14",
        xl: "w-20 h-20",
      },
      tier: {
        bronze: "ring-2 ring-amber-500/70 bg-amber-50 dark:bg-amber-950",
        silver: "ring-2 ring-slate-400 bg-slate-50 dark:bg-slate-900",
        gold: "ring-2 ring-yellow-400 bg-yellow-50 dark:bg-yellow-950",
        default: "bg-background",
      },
      state: {
        earned: "",
        locked: "grayscale opacity-40",
      },
    },
    defaultVariants: {
      size: "md",
      tier: "default",
      state: "earned",
    },
  }
);

interface UserBadgeProps extends VariantProps<typeof badgeVariants> {
  badge: {
    id: string;
    name: string;
    description: string;
    iconUrl: string;
    tier: 'bronze' | 'silver' | 'gold' | string;
    earned?: boolean;
    earnedDate?: Date;
  };
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showTooltip?: boolean;
  customization?: {
    isFavorite?: boolean;
    displayColor?: string | null;
  };
  userId?: string;
  showShare?: boolean;
  onCustomize?: () => void;
  className?: string;
}

export function UserBadge({
  badge,
  size = "md",
  tier,
  showTooltip = true,
  customization,
  userId,
  showShare = false,
  onCustomize,
  className,
}: UserBadgeProps) {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Use badge's tier if provided, otherwise use the prop
  const badgeTier = badge.tier || tier || "default";
  
  // Determine state based on earned property
  const state = badge.earned === false ? "locked" : "earned";
  
  // Format badge description for tooltip
  const tooltipContent = () => {
    let content = badge.name;
    
    if (badge.description) {
      content += `: ${badge.description}`;
    }
    
    if (badge.earned && badge.earnedDate) {
      content += ` (Earned: ${badge.earnedDate.toLocaleDateString()})`;
    } else if (badge.earned === false) {
      content += " (Locked)";
    }
    
    return content;
  };

  // Configure tier styling
  const tierStyles = {
    bronze: "border-amber-600",
    silver: "border-slate-400",
    gold: "border-yellow-500"
  };
  
  const tierSymbols = {
    bronze: "★",
    silver: "★★",
    gold: "★★★"
  };
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.example.com";
  
  // Size mapping for lock icon and fallback icons
  const iconSizeMap = {
    xs: "h-2.5 w-2.5",
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
    xl: "h-6 w-6",
  };
  
  // Determine the fallback icon based on badge name (for if image fails to load)
  const getFallbackIcon = () => {
    const nameLower = badge.name.toLowerCase();
    
    if (nameLower.includes('course') || nameLower.includes('learn')) {
      return <BookOpen className={cn("text-foreground", iconSizeMap[size || "md"])} />;
    } else if (nameLower.includes('engage') || nameLower.includes('comment')) {
      return <MessageSquare className={cn("text-foreground", iconSizeMap[size || "md"])} />;
    } else if (nameLower.includes('fast') || nameLower.includes('speed')) {
      return <Zap className={cn("text-foreground", iconSizeMap[size || "md"])} />;
    } else if (nameLower.includes('streak')) {
      return <Flame className={cn("text-foreground", iconSizeMap[size || "md"])} />;
    } else {
      return <Award className={cn("text-foreground", iconSizeMap[size || "md"])} />;
    }
  };
  
  // Validate icon URL
  const hasValidIconUrl = badge.iconUrl && (
    badge.iconUrl.startsWith('/') || 
    badge.iconUrl.startsWith('http') || 
    badge.iconUrl.startsWith('data:')
  );
  
  const BadgeComponent = (
    <div
      className={cn(
        badgeVariants({ size, tier: badgeTier as any, state }),
        className
      )}
    >
      {hasValidIconUrl && !imageError ? (
        <Image
          src={badge.iconUrl}
          alt={badge.name}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
          sizes={`(max-width: 768px) 100vw, ${
            size === "xl" ? "80px" : 
            size === "lg" ? "56px" : 
            size === "md" ? "40px" : 
            size === "sm" ? "28px" : "20px"
          }`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {getFallbackIcon()}
        </div>
      )}
      
      {/* Lock overlay for unearned badges */}
      {badge.earned === false && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
          <Lock className={cn("text-white", iconSizeMap[size || "md"])} />
        </div>
      )}
    </div>
  );
  
  return (
    <div className={cn("flex flex-col items-center", className)}>
      {showTooltip ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {BadgeComponent}
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex flex-col gap-1 max-w-[200px]">
                <h3 className="font-semibold">
                  {badge.name}
                  <span className="ml-1 opacity-70">
                    ({badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1)})
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
                {badge.earned === false && (
                  <p className="text-xs font-medium text-amber-600 mt-1">Complete requirements to unlock</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        BadgeComponent
      )}

      {/* Only show share for earned badges */}
      {showShare && userId && badge.earned !== false && (
        <>
          <div className="flex items-center justify-center mt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowShareOptions(!showShareOptions)}
              className="h-6 px-2 text-xs"
            >
              <Share2 className="h-3 w-3 mr-1" />
              Share
            </Button>
          </div>
          
          {showShareOptions && (
            <div className="mt-2">
              <BadgeShare 
                badge={badge} 
                profileUrl={`${appUrl}/profile/${userId}`} 
              />
            </div>
          )}
        </>
      )}
    </div>
  );
} 