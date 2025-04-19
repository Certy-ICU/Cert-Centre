/**
 * Push Notification Handler for Service Worker
 * 
 * Handles push notifications, displaying them to users, and managing notification click events.
 */

import { NotificationType } from './push-notifications';

// Notification action types
export enum NotificationAction {
  VIEW = 'view',
  DISMISS = 'dismiss',
  ACCEPT = 'accept',
  REJECT = 'reject',
  SNOOZE = 'snooze'
}

// Default notification options
const DEFAULT_NOTIFICATION_OPTIONS = {
  badge: '/images/badge-icon-72x72.png',
  icon: '/images/app-icon-192x192.png',
  vibrate: [100, 50, 100]
};

/**
 * Handles incoming push events in the service worker
 */
export function handlePushEvent(event: PushEvent): void {
  if (!event) return;
  
  event.waitUntil(processPushEvent(event));
}

/**
 * Process push event and display notification
 */
async function processPushEvent(event: PushEvent): Promise<void> {
  // Default notification data
  let notificationData = {
    title: 'Cert Centre',
    body: 'You have a new notification',
    tag: 'default',
    type: NotificationType.GENERAL,
    data: {}
  };
  
  // Extract payload
  try {
    if (event.data) {
      const payload = await event.data.json();
      notificationData = { ...notificationData, ...payload };
    }
  } catch (error) {
    console.error('Error processing push notification payload:', error);
  }
  
  // Configure actions based on notification type
  const actions = getNotificationActions(notificationData.type);
  
  // Display notification
  return self.registration.showNotification(notificationData.title, {
    ...DEFAULT_NOTIFICATION_OPTIONS,
    body: notificationData.body,
    tag: notificationData.tag || 'default',
    data: {
      ...notificationData.data,
      type: notificationData.type,
      timestamp: Date.now(),
      url: notificationData.data?.url || '/'
    },
    actions
  });
}

/**
 * Get actions configuration for notification types
 */
function getNotificationActions(type: NotificationType): NotificationAction[] {
  switch (type) {
    case NotificationType.CERTIFICATE_EXPIRY:
      return [
        { action: NotificationAction.VIEW, title: 'View Certificate' },
        { action: NotificationAction.SNOOZE, title: 'Remind Later' }
      ];
      
    case NotificationType.COURSE_REMINDER:
      return [
        { action: NotificationAction.VIEW, title: 'Go to Course' },
        { action: NotificationAction.DISMISS, title: 'Dismiss' }
      ];
      
    case NotificationType.ACCOUNT_ALERT:
      return [{ action: NotificationAction.VIEW, title: 'View Account' }];
      
    case NotificationType.EVENT_INVITATION:
      return [
        { action: NotificationAction.ACCEPT, title: 'Accept' },
        { action: NotificationAction.REJECT, title: 'Decline' }
      ];
      
    default:
      return [{ action: NotificationAction.VIEW, title: 'View' }];
  }
}

/**
 * Handles notification click events
 */
export function handleNotificationClick(event: NotificationEvent): void {
  if (!event) return;
  
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const clickedAction = event.action;
  
  event.waitUntil(processNotificationClick(notificationData, clickedAction));
}

/**
 * Process notification click action
 */
async function processNotificationClick(
  notificationData: any,
  clickedAction: string
): Promise<void> {
  const type = notificationData.type || NotificationType.GENERAL;
  const url = notificationData.url || '/';
  
  // Log notification interaction
  await storeNotificationInteraction(notificationData, clickedAction);
  
  // Handle different actions
  switch (clickedAction) {
    case NotificationAction.VIEW:
      return openOrFocusWindow(url);
      
    case NotificationAction.ACCEPT:
      return openOrFocusWindow(`${url}?action=accept`);
      
    case NotificationAction.REJECT:
      return openOrFocusWindow(`${url}?action=reject`);
      
    case NotificationAction.SNOOZE:
      return rescheduleNotification(notificationData);
      
    default:
      return openOrFocusWindow(url);
  }
}

/**
 * Open or focus a client window
 */
async function openOrFocusWindow(url: string): Promise<void> {
  const windowClients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  });
  
  for (const client of windowClients) {
    if (client.url === url && 'focus' in client) {
      await client.focus();
      return;
    }
  }
  
  await self.clients.openWindow(url);
}

/**
 * Store notification interaction data
 */
async function storeNotificationInteraction(
  notificationData: any,
  action: string
): Promise<void> {
  const db = await openDatabase();
  
  const interactionData = {
    notificationType: notificationData.type,
    notificationId: notificationData.id || notificationData.tag,
    action,
    timestamp: Date.now(),
    url: notificationData.url
  };
  
  const tx = db.transaction('notificationInteractions', 'readwrite');
  await tx.objectStore('notificationInteractions').add(interactionData);
  await tx.complete;
}

/**
 * Reschedule a notification for later
 */
async function rescheduleNotification(notificationData: any): Promise<void> {
  const showAfter = Date.now() + 60 * 60 * 1000; // 1 hour later
  
  const db = await openDatabase();
  
  const rescheduledNotification = {
    ...notificationData,
    showAfter,
    rescheduled: true
  };
  
  const tx = db.transaction('scheduledNotifications', 'readwrite');
  await tx.objectStore('scheduledNotifications').add(rescheduledNotification);
  await tx.complete;
}

/**
 * Opens the indexedDB database
 */
async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('certCentrePWA', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      
      if (!db.objectStoreNames.contains('notificationInteractions')) {
        db.createObjectStore('notificationInteractions', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('scheduledNotifications')) {
        db.createObjectStore('scheduledNotifications', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

/**
 * Check for scheduled notifications
 */
export async function checkScheduledNotifications(): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction('scheduledNotifications', 'readwrite');
  const store = tx.objectStore('scheduledNotifications');
  
  const now = Date.now();
  const notifications = await store.getAll();
  
  for (const notification of notifications) {
    if (notification.showAfter <= now) {
      await self.registration.showNotification(notification.title, {
        ...DEFAULT_NOTIFICATION_OPTIONS,
        body: notification.body,
        tag: notification.tag || 'default',
        data: notification.data
      });
      
      await store.delete(notification.id);
    }
  }
  
  await tx.complete;
} 