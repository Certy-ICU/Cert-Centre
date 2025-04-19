'use client';

import { useEffect, useState } from 'react';
import { registerServiceWorker, checkForUpdates, updateServiceWorker } from '@/lib/pwa/sw-registration';

export function PWAInitializer() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  
  useEffect(() => {
    // Register service worker on mount
    const initServiceWorker = async () => {
      await registerServiceWorker();
      
      // Check for updates periodically
      const checkInterval = setInterval(async () => {
        const hasUpdate = await checkForUpdates();
        if (hasUpdate) {
          setUpdateAvailable(true);
        }
      }, 60 * 60 * 1000); // Check every hour
      
      return () => clearInterval(checkInterval);
    };
    
    initServiceWorker();
    
    // Listen for online/offline status
    const handleOnline = () => {
      console.log('App is online');
      // Optionally sync pending data here
    };
    
    const handleOffline = () => {
      console.log('App is offline');
      // Optionally show offline indicator
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const applyUpdate = () => {
    updateServiceWorker();
  };
  
  // Only render UI if there's an update available
  if (!updateAvailable) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-white rounded-lg shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 max-w-sm">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
        Update Available
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        A new version of the app is available. Update now for the latest features and improvements.
      </p>
      <div className="flex justify-end">
        <button
          onClick={applyUpdate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Update Now
        </button>
      </div>
    </div>
  );
} 