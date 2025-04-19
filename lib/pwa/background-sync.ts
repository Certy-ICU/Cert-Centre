/**
 * Background Sync Module
 * 
 * Provides functionality for registering background sync tasks
 * that will be processed when the user has connectivity.
 */

import { processQueue } from './offline-data';

// Define sync tag names
export const SYNC_TAGS = {
  CERTIFICATES: 'sync-certificates',
  COURSES: 'sync-courses',
  PROFILE: 'sync-profile',
  NOTIFICATIONS: 'sync-notifications',
  DATA_UPLOAD: 'sync-data-upload'
};

/**
 * Check if background sync is supported by the browser
 */
export function isBackgroundSyncSupported(): boolean {
  return 'serviceWorker' in navigator && 
         'SyncManager' in window &&
         navigator.serviceWorker.controller !== null;
}

/**
 * Register a one-time background sync
 * 
 * @param tag - The sync tag identifier
 * @returns Promise that resolves when the sync is registered
 */
export async function registerBackgroundSync(tag: string): Promise<boolean> {
  if (!isBackgroundSyncSupported()) {
    console.warn('Background Sync not supported in this browser');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);
    console.log(`Background sync registered: ${tag}`);
    return true;
  } catch (error) {
    console.error('Failed to register background sync:', error);
    
    // Fall back to immediate sync if online
    if (navigator.onLine) {
      processQueue();
    }
    return false;
  }
}

/**
 * Check if a sync is already registered
 * 
 * @param tag - The sync tag identifier
 * @returns Promise that resolves to boolean indicating if sync is registered
 */
export async function isSyncRegistered(tag: string): Promise<boolean> {
  if (!isBackgroundSyncSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const tags = await registration.sync.getTags();
    return tags.includes(tag);
  } catch (error) {
    console.error('Failed to check sync registration:', error);
    return false;
  }
}

/**
 * Register sync for specific data types
 */
export async function syncCertificates(): Promise<boolean> {
  return registerBackgroundSync(SYNC_TAGS.CERTIFICATES);
}

export async function syncCourses(): Promise<boolean> {
  return registerBackgroundSync(SYNC_TAGS.COURSES);
}

export async function syncProfile(): Promise<boolean> {
  return registerBackgroundSync(SYNC_TAGS.PROFILE);
}

export async function syncNotifications(): Promise<boolean> {
  return registerBackgroundSync(SYNC_TAGS.NOTIFICATIONS);
}

export async function syncDataUpload(): Promise<boolean> {
  return registerBackgroundSync(SYNC_TAGS.DATA_UPLOAD);
}

/**
 * Register for all background syncs
 */
export async function registerAllBackgroundSyncs(): Promise<boolean[]> {
  const results = await Promise.all([
    syncCertificates(),
    syncCourses(),
    syncProfile(),
    syncNotifications()
  ]);
  
  return results;
}

/**
 * Helper function to trigger a background sync from UI actions
 * Falls back to immediate sync if background sync is not supported
 */
export async function triggerSync(tag: string): Promise<void> {
  const syncRegistered = await registerBackgroundSync(tag);
  
  if (!syncRegistered && navigator.onLine) {
    // If background sync registration failed but we're online,
    // process the queue immediately as fallback
    await processQueue();
  }
}

/**
 * Handle a background sync event in the service worker
 * This function should be called from the service worker's sync event handler
 */
export async function handleSyncEvent(tag: string): Promise<void> {
  console.log(`Handling background sync for tag: ${tag}`);
  
  // Different sync tags might need different handling
  switch (tag) {
    case SYNC_TAGS.CERTIFICATES:
    case SYNC_TAGS.COURSES:
    case SYNC_TAGS.PROFILE:
    case SYNC_TAGS.NOTIFICATIONS:
    case SYNC_TAGS.DATA_UPLOAD:
      // Process the general request queue
      await processQueue();
      break;
    default:
      console.warn(`Unknown sync tag: ${tag}`);
  }
}

// Add event listener message handler for communicating with the service worker
export function setupSyncListeners(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  
  // Listen for messages from the service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'sync-completed') {
      console.log(`Sync completed for tag: ${event.data.tag}`);
      // Dispatch an event that components can listen for
      window.dispatchEvent(new CustomEvent('sync-completed', { 
        detail: { tag: event.data.tag } 
      }));
    }
  });
}

/**
 * Initialize the background sync module
 */
export function initBackgroundSync(): void {
  if (!isBackgroundSyncSupported()) {
    console.warn('Background Sync is not supported in this browser');
    return;
  }
  
  setupSyncListeners();
  
  // Register for all syncs when we come online
  window.addEventListener('online', () => {
    registerAllBackgroundSyncs();
  });
} 