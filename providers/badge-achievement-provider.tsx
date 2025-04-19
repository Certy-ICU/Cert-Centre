"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { BadgeAchievementModal } from '@/components/gamification/badge-achievement-modal';
import { useAuth } from '@clerk/nextjs';

interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  tier: string;
}

interface BadgeAchievementContextType {
  showBadgeAchievement: (badge: Badge) => void;
}

const BadgeAchievementContext = createContext<BadgeAchievementContextType | null>(null);

export const useBadgeAchievement = () => {
  const context = useContext(BadgeAchievementContext);
  
  if (!context) {
    throw new Error('useBadgeAchievement must be used within a BadgeAchievementProvider');
  }
  
  return context;
};

export const BadgeAchievementProvider = ({ children }: { children: ReactNode }) => {
  const [currentBadge, setCurrentBadge] = useState<Badge | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const { userId } = useAuth();
  
  useEffect(() => {
    // Load previously seen badges from localStorage to avoid showing them again
    const loadSeenBadges = () => {
      const stored = localStorage.getItem('earnedBadges');
      if (stored) {
        try {
          setEarnedBadges(JSON.parse(stored));
        } catch (e) {
          console.error('Error parsing earnedBadges from localStorage', e);
          setEarnedBadges([]);
        }
      }
    };
    
    loadSeenBadges();
    
    // Check for new badges on load
    if (userId) {
      fetchLatestBadges();
    }
  }, [userId]);
  
  const fetchLatestBadges = async () => {
    try {
      const res = await fetch('/api/gamification/badges/latest');
      
      if (res.ok) {
        const data = await res.json();
        
        if (data.latestBadge && !earnedBadges.includes(data.latestBadge.id)) {
          showBadgeAchievement(data.latestBadge);
          
          // Add to earned badges to avoid showing again
          const updatedEarnedBadges = [...earnedBadges, data.latestBadge.id];
          setEarnedBadges(updatedEarnedBadges);
          localStorage.setItem('earnedBadges', JSON.stringify(updatedEarnedBadges));
        }
      }
    } catch (error) {
      console.error('Error fetching latest badges:', error);
    }
  };
  
  const showBadgeAchievement = (badge: Badge) => {
    // Don't show if already in earned badges list
    if (earnedBadges.includes(badge.id)) return;
    
    setCurrentBadge(badge);
    setIsOpen(true);
    
    // Add to earned badges to avoid showing again
    const updatedEarnedBadges = [...earnedBadges, badge.id];
    setEarnedBadges(updatedEarnedBadges);
    localStorage.setItem('earnedBadges', JSON.stringify(updatedEarnedBadges));
  };
  
  const handleClose = () => {
    setIsOpen(false);
    setCurrentBadge(null);
  };
  
  return (
    <BadgeAchievementContext.Provider value={{ showBadgeAchievement }}>
      {children}
      
      {currentBadge && userId && (
        <BadgeAchievementModal
          badge={currentBadge}
          userId={userId}
          isOpen={isOpen}
          onClose={handleClose}
        />
      )}
    </BadgeAchievementContext.Provider>
  );
}; 