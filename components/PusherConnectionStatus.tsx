"use client";

import { useState, useEffect } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { Badge } from "@/components/ui/badge";

export const PusherConnectionStatus = () => {
  const [connectionState, setConnectionState] = useState<string>("unknown");
  const [visible, setVisible] = useState(false);
  const [eventsReceived, setEventsReceived] = useState(0);

  useEffect(() => {
    // Set initial state
    setConnectionState(pusherClient.connection.state);

    // Monitor connection state
    const handleConnectionStateChange = (states: { previous: string; current: string }) => {
      console.log(`Pusher connection: ${states.previous} → ${states.current}`);
      setConnectionState(states.current);
      
      // Show the status indicator momentarily when state changes
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
    };

    // Monitor all events to track activity
    const handleEvent = () => {
      setEventsReceived(prev => prev + 1);
      // Show indicator briefly when events are received
      setVisible(true);
      setTimeout(() => setVisible(false), 3000);
    };

    // Bind to Pusher events
    pusherClient.connection.bind("state_change", handleConnectionStateChange);
    pusherClient.bind_global(handleEvent);

    // Initial visibility
    setVisible(true);
    setTimeout(() => setVisible(false), 5000);

    // Cleanup
    return () => {
      pusherClient.connection.unbind("state_change", handleConnectionStateChange);
      pusherClient.unbind_global(handleEvent);
    };
  }, []);

  // Don't render anything if not visible and in connected state
  if (!visible && connectionState === "connected") return null;

  // Show different status colors based on state
  const getStatusStyle = () => {
    switch (connectionState) {
      case "connected":
        return "bg-green-500 hover:bg-green-600";
      case "connecting":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "disconnected":
      case "failed":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  // Allow clicking to toggle visibility
  const toggleVisibility = () => {
    setVisible(!visible);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge 
        className={`cursor-pointer transition-all ${getStatusStyle()} flex items-center gap-2`}
        onClick={toggleVisibility}
      >
        <div className={`w-2 h-2 rounded-full ${connectionState === "connected" ? "bg-white animate-pulse" : "bg-white"}`} />
        <span>Pusher: {connectionState}</span>
        {eventsReceived > 0 && (
          <span className="text-xs font-normal ml-1">({eventsReceived} events)</span>
        )}
      </Badge>
    </div>
  );
}; 