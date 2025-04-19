"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BadgeShare } from "./badge-share";
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import confetti from 'canvas-confetti';
import { useEffect } from "react";

interface BadgeAchievementModalProps {
  badge: {
    id: string;
    name: string;
    description: string;
    iconUrl: string;
    tier: string;
  } | null;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const BadgeAchievementModal = ({
  badge,
  userId,
  isOpen,
  onClose
}: BadgeAchievementModalProps) => {
  useEffect(() => {
    if (isOpen && badge) {
      // Trigger confetti effect when modal opens
      const end = Date.now() + 1000;
      
      const colors = {
        bronze: ['#CD7F32', '#8B4513'],
        silver: ['#C0C0C0', '#A9A9A9'],
        gold: ['#FFD700', '#DAA520']
      };
      
      const particleColors = colors[badge.tier] || ['#1fb6ff', '#4339ff'];
      
      const confettiSettings = {
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: particleColors
      };
      
      (function frame() {
        confetti(confettiSettings);
        
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }
  }, [isOpen, badge]);
  
  if (!badge) return null;
  
  // Get tier styling
  const tierStyles = {
    bronze: "bg-amber-100 text-amber-800 border-amber-300",
    silver: "bg-slate-100 text-slate-800 border-slate-300",
    gold: "bg-yellow-100 text-yellow-800 border-yellow-300",
  };
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.example.com";
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">New Badge Achieved!</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-6">
          <div className="relative h-28 w-28 mb-4">
            <Image
              src={badge.iconUrl}
              alt={badge.name}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 112px"
            />
          </div>
          
          <h3 className="text-lg font-bold">{badge.name}</h3>
          
          <Badge 
            variant="outline" 
            className={`mt-2 ${tierStyles[badge.tier as keyof typeof tierStyles] || "bg-gray-100"}`}
          >
            {badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1)} Tier
          </Badge>
          
          <p className="text-sm text-center text-muted-foreground mt-3 max-w-xs">
            {badge.description}
          </p>
          
          <div className="mt-6 w-full">
            <BadgeShare 
              badge={badge} 
              profileUrl={`${appUrl}/profile/${userId}`} 
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 