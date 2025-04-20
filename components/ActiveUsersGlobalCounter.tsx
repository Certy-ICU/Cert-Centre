"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { pusherClient } from "@/lib/pusher-client";

export const ActiveUsersGlobalCounter = () => {
  const [activeUsers, setActiveUsers] = useState(0);

  useEffect(() => {
    // Subscribe to the global presence channel
    const channel = pusherClient.subscribe('presence-global');

    // Initial population of user count when subscription succeeds
    channel.bind('pusher:subscription_succeeded', (members: any) => {
      setActiveUsers(members.count);
    });

    // Update when a new user joins
    channel.bind('pusher:member_added', (member: any) => {
      setActiveUsers((current) => current + 1);
    });

    // Update when a user leaves
    channel.bind('pusher:member_removed', (member: any) => {
      setActiveUsers((current) => Math.max(0, current - 1));
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe('presence-global');
    };
  }, []);

  if (activeUsers <= 1) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="px-2 py-1 flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{activeUsers}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{activeUsers} people online right now</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}; 