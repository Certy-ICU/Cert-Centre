"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);
    
    // Add event listeners for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    window.location.href = "/";
  };

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-6 px-4">
      <div className="relative w-24 h-24 mb-2">
        <Image
          src="/logo.svg"
          alt="Cert Centre Logo"
          fill
          className="object-contain"
        />
      </div>
      <h1 className="text-3xl font-bold text-center">You are offline</h1>
      <p className="text-muted-foreground text-center max-w-md">
        {isOnline 
          ? "You're back online! Click the button below to continue."
          : "It seems you're currently offline. Some features may not be available until you reconnect to the internet."}
      </p>
      <div className="flex flex-col items-center gap-2">
        <Button 
          onClick={handleRetry}
          size="lg"
          className="mt-4"
          disabled={!isOnline}
        >
          {isOnline ? "Continue to app" : "Retry connection"}
        </Button>
        {!isOnline && (
          <p className="text-xs text-muted-foreground mt-2">
            Some previously visited content may still be available offline.
          </p>
        )}
      </div>
    </div>
  );
} 