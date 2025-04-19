/**
 * Push Notifications Implementation Example
 * 
 * This file demonstrates the pattern for implementing web push notifications
 * in the Cert Centre PWA. It includes subscription management, permission
 * handling, and service worker integration.
 */

// 1. Client-Side Subscription Management
//------------------------------------------------------

/**
 * Request notification permission and subscribe to push notifications
 * @returns {Promise<PushSubscription|null>} Push subscription or null if failed
 */
export async function subscribeToPushNotifications() {
  try {
    // Check if push notifications are supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported by this browser');
      return null;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Get VAPID public key from server
    const response = await fetch('/api/notifications/vapid-public-key');
    const { publicKey } = await response.json();
    
    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true, // Always show notification when received
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
    
    // Send subscription to server
    await saveSubscription(subscription);
    
    return subscription;
    
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
}

/**
 * Save push subscription to server
 * @param {PushSubscription} subscription - Push subscription object
 * @returns {Promise<void>}
 */
async function saveSubscription(subscription) {
  try {
    const response = await fetch('/api/notifications/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save subscription');
    }
    
    console.log('Push subscription saved to server');
    
  } catch (error) {
    console.error('Error saving push subscription:', error);
    throw error;
  }
}

/**
 * Unsubscribe from push notifications
 * @returns {Promise<boolean>} Success status
 */
export async function unsubscribeFromPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      return true; // Already unsubscribed
    }
    
    // Remove subscription from server
    await fetch('/api/notifications/subscriptions', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint
      })
    });
    
    // Unsubscribe from push manager
    const result = await subscription.unsubscribe();
    return result;
    
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
}

/**
 * Check if the user is currently subscribed to push notifications
 * @returns {Promise<boolean>} Subscription status
 */
export async function isPushNotificationSubscribed() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }
    
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    return !!subscription;
    
  } catch (error) {
    console.error('Error checking push subscription:', error);
    return false;
  }
}

/**
 * Update user notification preferences
 * @param {Object} preferences - Notification preferences
 * @returns {Promise<boolean>} Success status
 */
export async function updateNotificationPreferences(preferences) {
  try {
    const response = await fetch('/api/notifications/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferences)
    });
    
    return response.ok;
    
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return false;
  }
}

// 2. React Notification Components
//------------------------------------------------------

/**
 * React hook for managing notification permissions
 * @returns {Object} Notification permission state and functions
 */
export function useNotifications() {
  const [status, setStatus] = React.useState({
    permission: Notification.permission,
    isSubscribed: false,
    isLoading: true
  });
  
  React.useEffect(() => {
    let mounted = true;
    
    // Check current subscription status
    const checkSubscription = async () => {
      try {
        const isSubscribed = await isPushNotificationSubscribed();
        
        if (mounted) {
          setStatus(prev => ({ 
            ...prev, 
            isSubscribed,
            isLoading: false 
          }));
        }
        
      } catch (error) {
        console.error('Error checking subscription status:', error);
        if (mounted) {
          setStatus(prev => ({ ...prev, isLoading: false }));
        }
      }
    };
    
    checkSubscription();
    
    return () => {
      mounted = false;
    };
  }, []);
  
  // Request notification permission
  const requestPermission = async () => {
    try {
      setStatus(prev => ({ ...prev, isLoading: true }));
      
      // Subscribe to push notifications
      await subscribeToPushNotifications();
      
      // Update status
      setStatus({
        permission: Notification.permission,
        isSubscribed: true,
        isLoading: false
      });
      
      return true;
      
    } catch (error) {
      console.error('Error requesting permission:', error);
      setStatus(prev => ({ 
        ...prev, 
        permission: Notification.permission,
        isLoading: false 
      }));
      return false;
    }
  };
  
  // Unsubscribe from push notifications
  const unsubscribe = async () => {
    try {
      setStatus(prev => ({ ...prev, isLoading: true }));
      
      // Unsubscribe from push notifications
      const success = await unsubscribeFromPushNotifications();
      
      if (success) {
        setStatus({
          permission: Notification.permission, // Permission doesn't change on unsubscribe
          isSubscribed: false,
          isLoading: false
        });
      } else {
        setStatus(prev => ({ ...prev, isLoading: false }));
      }
      
      return success;
      
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setStatus(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };
  
  return {
    ...status,
    requestPermission,
    unsubscribe
  };
}

// 3. Utility Functions
//------------------------------------------------------

/**
 * Convert URL-safe base64 string to Uint8Array
 * @param {string} base64String - URL-safe base64 string
 * @returns {Uint8Array} Converted array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
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

// 4. Server-Side Push Notification (Example Node.js)
//------------------------------------------------------

/*
// This code would be part of your server-side implementation

const webpush = require('web-push');
const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Send notification to a specific user
async function sendNotification(userId, notification) {
  try {
    // Get user's subscriptions from database
    const subscriptions = await db.subscriptions.findMany({
      where: { userId }
    });
    
    // Send push notification to each subscription
    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            sub.subscription,
            JSON.stringify(notification)
          );
          return { success: true, subscription: sub };
        } catch (error) {
          // Handle expired or invalid subscriptions
          if (error.statusCode === 404 || error.statusCode === 410) {
            // Remove invalid subscription
            await db.subscriptions.delete({
              where: { id: sub.id }
            });
          }
          return { success: false, error, subscription: sub };
        }
      })
    );
    
    return results;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}
*/

// 5. Service Worker Implementation (would be in sw.js)
//------------------------------------------------------

/*
// This code would be part of your service worker implementation (sw.js)

// Handle push events
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push event received but no data');
    return;
  }
  
  try {
    // Parse notification data
    const data = event.data.json();
    
    // Show notification
    const notificationPromise = self.registration.showNotification(
      data.title || 'Cert Centre',
      {
        body: data.body || 'You have a new notification',
        icon: data.icon || '/icons/icon-192x192.png',
        badge: data.badge || '/icons/notification-badge.png',
        data: data.data || {},
        actions: data.actions || [],
        tag: data.tag, // Group notifications with the same tag
        renotify: data.renotify || false,
        requireInteraction: data.requireInteraction || false
      }
    );
    
    event.waitUntil(notificationPromise);
    
  } catch (error) {
    console.error('Error handling push event:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Get notification data
  const data = event.notification.data || {};
  const url = data.url || '/';
  
  // Handle notification action clicks
  if (event.action) {
    console.log(`Notification action clicked: ${event.action}`);
    // Handle specific actions here
  }
  
  // Focus existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there is already a window with the URL
        for (let client of windowClients) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
*/ 