"use client";

import { useState, useEffect } from 'react';

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    // Initial check
    const media = window.matchMedia(query);
    setMatches(media.matches);
    
    // Create an event listener to track changes
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Add the listener
    media.addEventListener('change', listener);
    
    // Clean up on unmount
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [query]);
  
  return matches;
};

// Predefined breakpoints matching Tailwind's defaults
export const useBreakpoint = () => {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isLargeDesktop = useMediaQuery('(min-width: 1280px)');
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    // Shorthand for common combinations
    isMobileOrTablet: isMobile || isTablet,
    isTabletOrDesktop: isTablet || isDesktop
  };
}; 