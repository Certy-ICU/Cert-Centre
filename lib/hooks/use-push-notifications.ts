'use client';

import { useState, useEffect } from 'react';
import { isPushSupported } from '@/lib/pwa/push-notifications';
import { useUser } from '@clerk/nextjs';

type SubscriptionStatus = 'unsupported' | 'default' | 'denied' | 'granted' | 'loading';

export function usePushNotifications() {
  const [status, setStatus] = useState<SubscriptionStatus>('loading');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const { isSignedIn, user } = useUser();

  // Check if push notifications are supported
  useEffect(() => {
    if (!isPushSupported()) {
      setStatus('unsupported');
      return;
    }

    if (!isSignedIn) {
      setStatus('default');
      return;
    }

    // Check permission status
    if (Notification.permission === 'granted') {
      setStatus('granted');
      getExistingSubscription();
    } else if (Notification.permission === 'denied') {
      setStatus('denied');
    } else {
      setStatus('default');
    }
  }, [isSignedIn]);

  // Get existing subscription
  const getExistingSubscription = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        
        if (existingSubscription) {
          setSubscription(existingSubscription);
          setStatus('granted');
        }
      }
    } catch (error) {
      console.error('Error checking push subscription:', error);
    }
  };

  // Subscribe to push notifications
  const subscribe = async () => {
    try {
      if (!isPushSupported() || !isSignedIn) {
        return false;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'default');
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Get VAPID public key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        console.error('VAPID public key not set');
        return false;
      }

      // Convert VAPID public key to Uint8Array
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      
      // Subscribe to push manager
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
      
      // Save subscription to state
      setSubscription(newSubscription);
      setStatus('granted');
      
      // Save subscription to server
      const userAgent = navigator.userAgent;
      const success = await saveSubscriptionToServer(newSubscription, userAgent);
      
      return success;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async () => {
    try {
      if (!subscription) {
        return true;
      }
      
      // Unsubscribe
      const success = await subscription.unsubscribe();
      
      if (success) {
        setSubscription(null);
        // Delete subscription from server
        await deleteSubscriptionFromServer(subscription.endpoint);
      }
      
      return success;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  };

  // Save subscription to server
  const saveSubscriptionToServer = async (subscription: PushSubscription, userAgent: string) => {
    try {
      const response = await fetch('/api/notifications/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription,
          userAgent
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error saving subscription to server:', error);
      return false;
    }
  };

  // Delete subscription from server
  const deleteSubscriptionFromServer = async (endpoint: string) => {
    try {
      const response = await fetch('/api/notifications/subscriptions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error deleting subscription from server:', error);
      return false;
    }
  };

  // Helper to convert base64 to Uint8Array for VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
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
  };

  return {
    status,
    subscription,
    subscribe,
    unsubscribe,
    isSupported: status !== 'unsupported',
    isSubscribed: !!subscription
  };
} 