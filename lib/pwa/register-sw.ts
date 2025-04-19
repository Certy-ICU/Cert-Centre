/**
 * Service Worker Registration Module
 * 
 * This module handles the registration and updates of the service worker
 * for the Progressive Web App.
 */

import { initOfflineData } from './offline-data';
import { initBackgroundSync } from './background-sync';

// Service worker file path
const SW_PATH = '/service-worker.js';

// Check if service workers are supported
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Register the service worker
 * @returns Promise resolving to registration object or null if not supported
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    console.warn('Service Workers are not supported in this browser');
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.register(SW_PATH);
    console.log('Service Worker registered successfully:', registration.scope);
    
    // Initialize related PWA modules
    initOfflineData();
    initBackgroundSync();
    
    // Set up update checks
    setupPeriodicSWUpdateChecks(registration);
    
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Check for service worker updates
 * @param registration The service worker registration
 */
export function checkForUpdates(registration: ServiceWorkerRegistration): Promise<boolean> {
  return registration.update()
    .then(() => {
      if (registration.waiting) {
        // If there's a new service worker waiting, notify the user
        notifyUserOfUpdate(registration);
        return true;
      }
      return false;
    })
    .catch(error => {
      console.error('Error checking for Service Worker updates:', error);
      return false;
    });
}

/**
 * Set up periodic checks for service worker updates
 * @param registration The service worker registration
 */
function setupPeriodicSWUpdateChecks(registration: ServiceWorkerRegistration): void {
  // Check for updates when the page becomes visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkForUpdates(registration);
    }
  });
  
  // Check for updates on network reconnect
  window.addEventListener('online', () => {
    checkForUpdates(registration);
  });
  
  // Check for updates every hour
  setInterval(() => {
    checkForUpdates(registration);
  }, 60 * 60 * 1000); // 1 hour
}

/**
 * Notify the user of a service worker update
 * @param registration The service worker registration with an update waiting
 */
export function notifyUserOfUpdate(registration: ServiceWorkerRegistration): void {
  if (!registration.waiting) {
    return;
  }
  
  // Dispatch an event that UI components can listen for
  window.dispatchEvent(new CustomEvent('sw-update-available', {
    detail: { registration }
  }));
}

/**
 * Prompt the user to update the service worker
 * @param registration The service worker registration with an update waiting
 * @returns Promise resolving when the update is complete
 */
export function applyUpdate(registration: ServiceWorkerRegistration): Promise<void> {
  return new Promise((resolve, reject) => {
    // Skip waiting on the waiting service worker
    if (!registration.waiting) {
      reject(new Error('No service worker is waiting'));
      return;
    }
    
    // Create message channel to know when the service worker has taken control
    const channel = new MessageChannel();
    
    channel.port1.onmessage = (event) => {
      if (event.data.type === 'sw-activated') {
        resolve();
      } else {
        reject(new Error('Unexpected message from service worker'));
      }
    };
    
    // Send skip waiting message to the waiting service worker
    registration.waiting.postMessage({
      type: 'SKIP_WAITING'
    }, [channel.port2]);
    
    // Also reload the page to ensure the new service worker takes control
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  });
}

/**
 * Unregister all service workers
 * Useful for troubleshooting or when significant service worker changes are made
 */
export async function unregisterServiceWorkers(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }
  
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    await Promise.all(
      registrations.map(registration => registration.unregister())
    );
    
    return true;
  } catch (error) {
    console.error('Error unregistering service workers:', error);
    return false;
  }
}

// Create a hook for React components to use service worker functionality
export function createServiceWorkerManager() {
  let swRegistration: ServiceWorkerRegistration | null = null;
  
  return {
    /**
     * Initialize the service worker
     */
    async initialize(): Promise<boolean> {
      swRegistration = await registerServiceWorker();
      return swRegistration !== null;
    },
    
    /**
     * Check if a service worker update is available
     */
    async checkForUpdates(): Promise<boolean> {
      if (!swRegistration) return false;
      return checkForUpdates(swRegistration);
    },
    
    /**
     * Apply a pending service worker update
     */
    async applyUpdate(): Promise<boolean> {
      if (!swRegistration || !swRegistration.waiting) return false;
      try {
        await applyUpdate(swRegistration);
        return true;
      } catch (error) {
        console.error('Failed to apply update:', error);
        return false;
      }
    },
    
    /**
     * Unregister all service workers
     */
    async unregister(): Promise<boolean> {
      return unregisterServiceWorkers();
    },
    
    /**
     * Get the current service worker registration
     */
    getRegistration(): ServiceWorkerRegistration | null {
      return swRegistration;
    }
  };
} 