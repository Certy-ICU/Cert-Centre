'use client';

import { useEffect } from 'react';
import { DailyLoginPoints } from './DailyLoginPoints';
import { useUser } from '@clerk/nextjs';

export const GamificationClientInit = () => {
  const { isSignedIn, isLoaded } = useUser();

  // Log when the component loads
  useEffect(() => {
    console.log('GamificationClientInit loaded. User signed in:', isSignedIn);
  }, [isSignedIn]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <>
      <DailyLoginPoints />
      {/* Add more client-side gamification components here as needed */}
    </>
  );
}; 