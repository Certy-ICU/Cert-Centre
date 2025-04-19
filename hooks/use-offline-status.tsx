'use client';

import { useState, useEffect } from 'react';

/**
 * A hook that tracks the offline status of the application.
 * 
 * @returns {Object} An object containing:
 *  - isOffline: boolean indicating if the app is offline
 *  - wasOffline: boolean indicating if the app was offline during the current session
 *  - lastOnlineAt: Date when the app was last online or null if never
 */
export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(
    !isOffline ? new Date() : null
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setLastOnlineAt(new Date());
    };

    const handleOffline = () => {
      setIsOffline(true);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOffline,
    wasOffline,
    lastOnlineAt,
  };
}

/**
 * A hook that returns a function to safely execute callbacks based on online status.
 * 
 * @returns {Function} A function that takes an online callback, an offline callback, and options
 */
export function useSafeOnlineAction() {
  const { isOffline } = useOfflineStatus();

  /**
   * Safely execute a callback based on online status
   * 
   * @param onlineCallback Function to call when online
   * @param offlineCallback Optional function to call when offline
   * @param options Configuration options
   * @returns Result of the executed callback
   */
  const safeOnlineAction = <T,>(
    onlineCallback: () => T,
    offlineCallback?: () => T,
    options: {
      showToast?: boolean;
      toastMessage?: string;
    } = {}
  ): T => {
    const { showToast = true, toastMessage = 'You are offline. This action will be completed when you reconnect.' } = options;

    if (!isOffline) {
      return onlineCallback();
    }

    if (showToast) {
      // Use whatever toast library you have
      console.warn(toastMessage);
      // If you have a toast library like react-hot-toast:
      // toast.error(toastMessage);
    }

    if (offlineCallback) {
      return offlineCallback();
    }

    // Default fallback for when offline
    return null as T;
  };

  return safeOnlineAction;
} 