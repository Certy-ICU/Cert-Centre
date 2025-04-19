/**
 * Push Notifications Module
 * 
 * This module provides an interface for managing push notifications:
 * - Subscribing to push notifications
 * - Unsubscribing from push notifications
 * - Handling notification permissions
 * - Sending notification updates to the server
 */

// Database for storing notification settings
import { openDatabase } from './offline-sync';

// Notification topics that can be subscribed to
export enum NotificationTopic {
  COURSES_UPDATES = 'courses-updates',
  CERTIFICATE_STATUS = 'certificate-status',
  COMMUNITY_MESSAGES = 'community-messages',
  SYSTEM_ANNOUNCEMENTS = 'system-announcements'
}

// Notification permission status
export enum PermissionStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  PROMPT = 'prompt',
  UNSUPPORTED = 'unsupported'
}

// Interface for notification settings
export interface NotificationSettings {
  userId: string;
  topics: Record<NotificationTopic, boolean>;
  deviceToken?: string;
  lastUpdated: number;
}

// Default VAPID public key (should be replaced with actual value from server)
// This would typically be loaded from an environment variable or config
const DEFAULT_PUBLIC_VAPID_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

// Available notification types
export enum NotificationType {
  GENERAL = 'general',
  CERTIFICATE_EXPIRY = 'certificate_expiry',
  COURSE_REMINDER = 'course_reminder',
  ACCOUNT_ALERT = 'account_alert',
  EVENT_INVITATION = 'event_invitation'
}

// Notification priority levels
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high'
}

// Server public key for VAPID authentication
const VAPID_PUBLIC_KEY = 'BOz-xuB_RQpqWYiAvdwrAnkPNZG8YpEakhCvGzJVRQCiPJxHn0Qi9BPkDyatfSsgSc9NeO9hbiJTxa1c8M1rk6g';

/**
 * Checks if Push API is supported in the current browser
 * 
 * @returns Boolean indicating if push is supported
 */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         'Notification' in window;
}

/**
 * Gets the current notification permission status
 * 
 * @returns Current permission status
 */
export function getPermissionStatus(): PermissionStatus {
  if (!isPushSupported()) {
    return PermissionStatus.UNSUPPORTED;
  }
  
  const permission = Notification.permission;
  
  switch (permission) {
    case 'granted':
      return PermissionStatus.GRANTED;
    case 'denied':
      return PermissionStatus.DENIED;
    default:
      return PermissionStatus.PROMPT;
  }
}

/**
 * Requests permission for notifications
 * 
 * @returns Promise resolving with the new permission status
 */
export async function requestPermission(): Promise<PermissionStatus> {
  if (!isPushSupported()) {
    return PermissionStatus.UNSUPPORTED;
  }
  
  try {
    const permission = await Notification.requestPermission();
    
    switch (permission) {
      case 'granted':
        return PermissionStatus.GRANTED;
      case 'denied':
        return PermissionStatus.DENIED;
      default:
        return PermissionStatus.PROMPT;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return PermissionStatus.PROMPT;
  }
}

/**
 * Subscribes the user to push notifications
 * 
 * @param userId The user's ID
 * @param vapidPublicKey Optional VAPID public key (if not provided, will use default)
 * @returns Promise resolving with the push subscription
 */
export async function subscribeToPush(
  userId: string, 
  vapidPublicKey = DEFAULT_PUBLIC_VAPID_KEY
): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }
  
  const permission = await requestPermission();
  
  if (permission !== PermissionStatus.GRANTED) {
    throw new Error('Notification permission not granted');
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Get existing subscription or create a new one
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Convert VAPID public key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    }
    
    // Save subscription to server
    await saveSubscriptionToServer(subscription, userId);
    
    // Save user's notification settings locally
    await saveNotificationSettings(userId);
    
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribes from push notifications
 * 
 * @param userId The user's ID
 * @returns Promise resolving with boolean indicating success
 */
export async function unsubscribeFromPush(userId: string): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      return true; // Already unsubscribed
    }
    
    // Unsubscribe
    const success = await subscription.unsubscribe();
    
    if (success) {
      // Notify server about unsubscription
      await deleteSubscriptionFromServer(subscription, userId);
      
      // Remove local notification settings
      await deleteNotificationSettings(userId);
    }
    
    return success;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

/**
 * Gets the current push subscription
 * 
 * @returns Promise resolving with the current subscription or null
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Failed to get current subscription:', error);
    return null;
  }
}

/**
 * Gets user's notification settings
 * 
 * @param userId The user's ID
 * @returns Promise resolving with the user's notification settings
 */
export async function getNotificationSettings(userId: string): Promise<NotificationSettings | null> {
  if (!userId) {
    return null;
  }
  
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('notifications', 'readonly');
    const store = transaction.objectStore('notifications');
    
    const request = store.get(userId);
    
    request.onerror = () => {
      reject(new Error(`Failed to get notification settings: ${request.error?.message || 'Unknown error'}`));
    };
    
    request.onsuccess = () => {
      if (!request.result) {
        // Return default settings if none exist
        resolve({
          userId,
          topics: {
            [NotificationTopic.COURSES_UPDATES]: true,
            [NotificationTopic.CERTIFICATE_STATUS]: true,
            [NotificationTopic.COMMUNITY_MESSAGES]: true,
            [NotificationTopic.SYSTEM_ANNOUNCEMENTS]: true
          },
          lastUpdated: Date.now()
        });
      } else {
        resolve(request.result);
      }
    };
  });
}

/**
 * Saves user's notification settings
 * 
 * @param userId The user's ID
 * @param topics Optional specific topic settings to save
 * @returns Promise resolving when settings are saved
 */
export async function saveNotificationSettings(
  userId: string,
  topics?: Partial<Record<NotificationTopic, boolean>>
): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  // Get current settings or create default
  const currentSettings = await getNotificationSettings(userId);
  
  const newSettings: NotificationSettings = {
    userId,
    topics: {
      ...currentSettings?.topics || {
        [NotificationTopic.COURSES_UPDATES]: true,
        [NotificationTopic.CERTIFICATE_STATUS]: true,
        [NotificationTopic.COMMUNITY_MESSAGES]: true,
        [NotificationTopic.SYSTEM_ANNOUNCEMENTS]: true
      },
      ...(topics || {})
    },
    deviceToken: currentSettings?.deviceToken,
    lastUpdated: Date.now()
  };
  
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('notifications', 'readwrite');
    const store = transaction.objectStore('notifications');
    
    const request = store.put(newSettings);
    
    request.onerror = () => {
      reject(new Error(`Failed to save notification settings: ${request.error?.message || 'Unknown error'}`));
    };
    
    request.onsuccess = () => {
      // Sync changes with server if online
      if (navigator.onLine) {
        syncNotificationSettingsWithServer(newSettings).catch(console.error);
      }
      
      resolve();
    };
  });
}

/**
 * Deletes user's notification settings
 * 
 * @param userId The user's ID
 * @returns Promise resolving when settings are deleted
 */
export async function deleteNotificationSettings(userId: string): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('notifications', 'readwrite');
    const store = transaction.objectStore('notifications');
    
    const request = store.delete(userId);
    
    request.onerror = () => {
      reject(new Error(`Failed to delete notification settings: ${request.error?.message || 'Unknown error'}`));
    };
    
    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Updates subscription for a specific topic
 * 
 * @param userId The user's ID
 * @param topic The notification topic
 * @param subscribe Whether to subscribe or unsubscribe
 * @returns Promise resolving when subscription is updated
 */
export async function updateTopicSubscription(
  userId: string,
  topic: NotificationTopic,
  subscribe: boolean
): Promise<void> {
  await saveNotificationSettings(userId, { [topic]: subscribe });
}

/**
 * Sends a test notification
 * 
 * @param title The notification title
 * @param options Additional notification options
 * @returns Promise resolving when notification is shown
 */
export async function sendTestNotification(
  title: string = 'Test Notification',
  options: NotificationOptions = {}
): Promise<void> {
  if (!isPushSupported()) {
    throw new Error('Notifications are not supported in this browser');
  }
  
  const permission = getPermissionStatus();
  
  if (permission !== PermissionStatus.GRANTED) {
    throw new Error('Notification permission not granted');
  }
  
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification(title, {
      body: 'This is a test notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      ...options
    });
  } else {
    // Fallback for browsers without service worker support
    new Notification(title, {
      body: 'This is a test notification',
      icon: '/icons/icon-192x192.png',
      ...options
    });
  }
}

/**
 * Converts a base64 string to Uint8Array for push subscription
 * 
 * @param base64String The base64 string to convert
 * @returns Uint8Array representation
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

/**
 * Saves push subscription to server
 * 
 * @param subscription The push subscription
 * @param userId The user's ID
 * @returns Promise resolving when subscription is saved
 */
async function saveSubscriptionToServer(
  subscription: PushSubscription,
  userId: string
): Promise<void> {
  try {
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent,
        createdAt: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    
    // Save device token if provided
    if (data.deviceToken) {
      const settings = await getNotificationSettings(userId);
      
      if (settings) {
        settings.deviceToken = data.deviceToken;
        await saveNotificationSettings(userId);
      }
    }
  } catch (error) {
    console.error('Failed to save subscription to server:', error);
    throw error;
  }
}

/**
 * Deletes push subscription from server
 * 
 * @param subscription The push subscription
 * @param userId The user's ID
 * @returns Promise resolving when subscription is deleted
 */
async function deleteSubscriptionFromServer(
  subscription: PushSubscription,
  userId: string
): Promise<void> {
  try {
    const response = await fetch('/api/notifications/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        subscription: subscription.toJSON()
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
    }
  } catch (error) {
    console.error('Failed to delete subscription from server:', error);
    throw error;
  }
}

/**
 * Syncs notification settings with server
 * 
 * @param settings The notification settings
 * @returns Promise resolving when settings are synced
 */
async function syncNotificationSettingsWithServer(
  settings: NotificationSettings
): Promise<void> {
  try {
    const response = await fetch('/api/notifications/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings)
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
    }
  } catch (error) {
    console.error('Failed to sync notification settings with server:', error);
    throw error;
  }
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Check if we have notification permission
 */
export function hasNotificationPermission(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Convert base64 VAPID key to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    
    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });
    
    // Send subscription to server
    await saveSubscriptionToServer(subscription);
    
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) return true;
    
    // Unsubscribe from push
    await subscription.unsubscribe();
    
    // Notify server about unsubscription
    await deleteSubscriptionFromServer(subscription);
    
    return true;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

/**
 * Send a notification via the server
 */
export async function sendNotification(
  title: string,
  options: { 
    body: string;
    type?: NotificationType;
    priority?: NotificationPriority;
    url?: string;
    tag?: string;
    [key: string]: any;
  }
): Promise<boolean> {
  const notificationData = {
    title,
    ...options,
    type: options.type || NotificationType.GENERAL,
    priority: options.priority || NotificationPriority.NORMAL
  };
  
  try {
    const response = await fetch('/api/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return false;
  }
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
} 