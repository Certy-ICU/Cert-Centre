"use client";

import { useState, useEffect } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { Badge } from "@/components/ui/badge";

export const RealtimeEventIndicator = () => {
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [showIndicator, setShowIndicator] = useState(false);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    // Handle all events
    const handleEvent = (channelName: string, eventName: string) => {
      // Skip internal Pusher events
      if (eventName.startsWith('pusher:')) return;
      
      setLastEvent(`${eventName} on ${channelName}`);
      setEventCount(prev => prev + 1);
      setShowIndicator(true);
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setShowIndicator(false);
      }, 3000);
    };

    pusherClient.bind_global((eventName, data) => {
      const channel = data?.channel || 'unknown';
      handleEvent(channel, eventName);
    });

    return () => {
      pusherClient.unbind_global();
    };
  }, []);

  if (!showIndicator) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-left">
      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></span>
        Real-time update
      </Badge>
    </div>
  );
}; 