'use client';

import { useState } from 'react';
import { Bell, BellOff } from "lucide-react";
import { usePushNotifications } from '@/lib/hooks/use-push-notifications';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';

interface NotificationToggleProps {
  variant?: 'button' | 'switch';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function NotificationToggle({ 
  variant = 'button', 
  size = 'md', 
  showLabel = true 
}: NotificationToggleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { 
    status, 
    isSupported, 
    isSubscribed, 
    subscribe, 
    unsubscribe 
  } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  const handleToggle = async () => {
    try {
      setIsLoading(true);
      
      if (isSubscribed) {
        const success = await unsubscribe();
        if (success) {
          toast.success('Notifications disabled');
        } else {
          toast.error('Failed to disable notifications');
        }
      } else {
        const success = await subscribe();
        if (success) {
          toast.success('Notifications enabled');
        } else if (status === 'denied') {
          toast.error('Notification permission denied. Please enable in browser settings.');
        } else {
          toast.error('Failed to enable notifications');
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'switch') {
    return (
      <div className="flex items-center space-x-2">
        <Switch
          id="notifications"
          checked={isSubscribed}
          onCheckedChange={handleToggle}
          disabled={isLoading || status === 'denied'}
        />
        {showLabel && (
          <Label htmlFor="notifications" className="cursor-pointer">
            Receive notifications
          </Label>
        )}
      </div>
    );
  }

  // Button variant
  const sizeClasses = {
    sm: 'h-8 px-2',
    md: 'h-10 px-4',
    lg: 'h-12 px-6'
  };

  return (
    <Button
      variant={isSubscribed ? "default" : "outline"}
      className={sizeClasses[size]}
      onClick={handleToggle}
      disabled={isLoading || status === 'denied'}
    >
      {isSubscribed ? (
        <>
          <Bell className="mr-2 h-4 w-4" />
          {showLabel && "Notifications On"}
        </>
      ) : (
        <>
          <BellOff className="mr-2 h-4 w-4" />
          {showLabel && "Notifications Off"}
        </>
      )}
    </Button>
  );
} 