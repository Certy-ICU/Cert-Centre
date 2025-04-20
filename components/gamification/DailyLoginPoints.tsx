'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { handleDailyLoginPoints } from '@/lib/actions/points';
import { showPointsNotification } from './badge-notification';

export const DailyLoginPoints = () => {
  const { isSignedIn, isLoaded } = useUser();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Only run this once when the component mounts and user is loaded
    if (isLoaded && isSignedIn && !checked) {
      setChecked(true);
      handleDailyLogin();
    }
  }, [isLoaded, isSignedIn, checked]);

  const handleDailyLogin = async () => {
    try {
      // Add a small delay to avoid immediate execution during page load
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const result = await handleDailyLoginPoints();
      
      if (result.success && !result.alreadyAwarded) {
        // Show notification about earned points
        const streakText = result.streak > 1 
          ? `${result.streakBonus} streak bonus! (${result.streak} day streak)` 
          : '';
          
        showPointsNotification({
          title: 'Daily Login',
          points: result.points,
          message: `You've earned ${result.points} points for logging in today! ${streakText}`,
        });
      }
    } catch (error) {
      console.error('Error awarding daily login points:', error);
    }
  };

  // This component doesn't render anything visible
  return null;
}; 