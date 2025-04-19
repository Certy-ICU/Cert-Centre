/**
 * Service Worker Helper
 * 
 * This module provides utilities for registering and managing service workers
 * and handling various PWA features like background sync and periodic sync.
 */

import { PeriodicSyncTag } from './periodic-sync';
import { SyncStatus } from './offline-sync';

/**
 * Registers the service worker for the application
 * 
 * @param scope Optional scope for the service worker
 * @returns Promise resolving to the ServiceWorkerRegistration or null if registration failed
 */
export async function registerServiceWorker(
  scope?: string
): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: scope || '/'
    });
    
    console.log('Service worker registered successfully');
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

/**
 * Checks if the service worker is active
 * 
 * @returns Boolean indicating if service worker is active
 */
export function isServiceWorkerActive(): boolean {
  return 'serviceWorker' in navigator && 
         navigator.serviceWorker.controller !== null;
}

/**
 * Interface for background sync message data
 */
export interface BackgroundSyncMessage {
  type: 'SYNC_TYPE';
  action: string;
  payload: any;
}

/**
 * Interface for periodic sync message data
 */
export interface PeriodicSyncMessage {
  type: 'PERIODIC_SYNC';
  tag: PeriodicSyncTag;
  timestamp: number;
}

/**
 * Type for all service worker messages
 */
export type ServiceWorkerMessage = BackgroundSyncMessage | PeriodicSyncMessage;

/**
 * Sends a message to the service worker
 * 
 * @param message The message to send
 * @returns Promise resolving to the response from the service worker or null if sending failed
 */
export async function sendMessageToSW(
  message: ServiceWorkerMessage
): Promise<any> {
  if (!isServiceWorkerActive()) {
    console.warn('Cannot send message - service worker not active');
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
    navigator.serviceWorker.controller?.postMessage(message, [
      messageChannel.port2
    ]);
    
    // Wait for the response with a timeout
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve({ error: 'Timeout waiting for service worker response' }), 3000);
    });
    
    return Promise.race([responsePromise, timeoutPromise]);
  } catch (error) {
    console.error('Error sending message to service worker:', error);
    return null;
  }
}

/**
 * Listens for messages from the service worker
 * 
 * @param callback Function to call when a message is received
 * @returns Function to remove the event listener
 */
export function listenForSWMessages(
  callback: (event: MessageEvent) => void
): () => void {
  const handler = (event: MessageEvent) => {
    callback(event);
  };
  
  navigator.serviceWorker.addEventListener('message', handler);
  
  // Return a function to remove the listener
  return () => {
    navigator.serviceWorker.removeEventListener('message', handler);
  };
}

/**
 * Triggers a sync event manually
 * 
 * @param tag The sync tag to trigger
 * @returns Promise resolving to a boolean indicating success
 */
export async function triggerSync(tag: string): Promise<boolean> {
  if (!isServiceWorkerActive()) {
    console.warn('Cannot trigger sync - service worker not active');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    if ('sync' in registration) {
      await registration.sync.register(tag);
      console.log(`Sync triggered: ${tag}`);
      return true;
    } else {
      console.warn('Background Sync not supported in this browser');
      
      // Fall back to a direct message to the service worker
      const response = await sendMessageToSW({
        type: 'SYNC_TYPE',
        action: 'MANUAL_SYNC',
        payload: { tag }
      });
      
      return response && !response.error;
    }
  } catch (error) {
    console.error('Error triggering sync:', error);
    return false;
  }
}

/**
 * Checks the status of a sync operation
 * 
 * @param tag The sync tag to check
 * @returns Promise resolving to the sync status
 */
export async function checkSyncStatus(tag: string): Promise<SyncStatus> {
  if (!isServiceWorkerActive()) {
    return SyncStatus.FAILED;
  }

  try {
    const response = await sendMessageToSW({
      type: 'SYNC_TYPE',
      action: 'CHECK_STATUS',
      payload: { tag }
    });
    
    return response?.status || SyncStatus.UNKNOWN;
  } catch (error) {
    console.error('Error checking sync status:', error);
    return SyncStatus.UNKNOWN;
  }
}

/**
 * Updates the service worker
 * 
 * @returns Promise resolving to a boolean indicating success
 */
export async function updateServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerActive()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    
    console.log('Service worker updated successfully');
    return true;
  } catch (error) {
    console.error('Service worker update failed:', error);
    return false;
  }
}

/**
 * Unregisters the service worker
 * 
 * @returns Promise resolving to a boolean indicating success
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerActive()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const success = await registration.unregister();
    
    if (success) {
      console.log('Service worker unregistered successfully');
    } else {
      console.warn('Service worker unregistration failed');
    }
    
    return success;
  } catch (error) {
    console.error('Error unregistering service worker:', error);
    return false;
  }
} 