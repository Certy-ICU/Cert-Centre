/**
 * Service Worker Registration for PWA
 * 
 * This module handles service worker registration and contains
 * helpers related to PWA functionality like checking online status
 * and handling updates.
 */

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Listen for online/offline status changes
 */
export function setupOnlineListeners(
  onlineCallback: () => void,
  offlineCallback: () => void
): () => void {
  const handleOnline = () => {
    console.log('Browser is online');
    onlineCallback();
  };

  const handleOffline = () => {
    console.log('Browser is offline');
    offlineCallback();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Send a message to the service worker
 */
export async function sendMessageToSW(message: any): Promise<any> {
  if (!navigator.serviceWorker.controller) {
    return null;
  }

  try {
    const messageChannel = new MessageChannel();
    
    // Create a promise that will resolve with the response
    const responsePromise = new Promise((resolve) => {
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };
    });
    
    // Send the message
    navigator.serviceWorker.controller.postMessage(message, [
      messageChannel.port2
    ]);
    
    // Wait for response with timeout
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve({ error: 'Timeout' }), 3000);
    });
    
    return Promise.race([responsePromise, timeoutPromise]);
  } catch (error) {
    console.error('Error sending message to service worker:', error);
    return null;
  }
}

/**
 * Get the current service worker registration
 */
export async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.getRegistration();
  } catch (error) {
    console.error('Error getting service worker registration:', error);
    return null;
  }
}

/**
 * Check for service worker updates
 */
export async function checkForUpdates(): Promise<boolean> {
  const registration = await getRegistration();
  if (!registration) {
    return false;
  }

  try {
    await registration.update();
    return !!registration.waiting;
  } catch (error) {
    console.error('Error checking for updates:', error);
    return false;
  }
}

/**
 * Update the service worker
 */
export async function updateServiceWorker(): Promise<boolean> {
  const registration = await getRegistration();
  if (!registration || !registration.waiting) {
    return false;
  }

  // Skip waiting and reload
  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  
  // Reload the page
  window.location.reload();
  return true;
}

/**
 * React hook for service worker functionality
 */
export function usePWA() {
  // This should be implemented with React hooks
  // But TypeScript definition would pull in React as a dependency
  // So we'll keep it simple for now
  
  return {
    registerSW: registerServiceWorker,
    checkForUpdates,
    updateSW: updateServiceWorker,
    isOnline,
    setupOnlineListeners
  };
} 