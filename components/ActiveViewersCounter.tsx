"use client";

import { useState, useEffect } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { useUser } from "@clerk/nextjs";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  imageUrl: string | null;
}

interface ActiveViewersCounterProps {
  chapterId: string;
  className?: string;
}

export const ActiveViewersCounter = ({ chapterId, className }: ActiveViewersCounterProps) => {
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [hasActivity, setHasActivity] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const channelName = `presence-chapter-${chapterId}`;
    const channel = pusherClient.subscribe(channelName);

    // Handle subscription success - get initial members
    channel.bind('pusher:subscription_succeeded', (data: any) => {
      const initialUsers = Object.values(data.members || {}) as User[];
      setActiveUsers(initialUsers);
      
      // Highlight the counter briefly
      if (initialUsers.length > 1) {
        setHasActivity(true);
        setTimeout(() => setHasActivity(false), 3000);
      }
    });

    // When a new member joins
    channel.bind('pusher:member_added', (member: { id: string, info: User }) => {
      setActiveUsers(prev => {
        if (prev.some(u => u.id === member.info.id)) return prev;
        
        // Highlight the counter briefly
        setHasActivity(true);
        setTimeout(() => setHasActivity(false), 3000);
        
        return [...prev, member.info];
      });
    });

    // When a member leaves
    channel.bind('pusher:member_removed', (member: { id: string }) => {
      setActiveUsers(prev => prev.filter(u => u.id !== member.id));
    });
    
    // Custom user events
    channel.bind('user:active', (data: { user: User }) => {
      setActiveUsers(prev => {
        if (prev.some(u => u.id === data.user.id)) return prev;
        
        setHasActivity(true);
        setTimeout(() => setHasActivity(false), 3000);
        
        return [...prev, data.user];
      });
    });
    
    channel.bind('user:inactive', (data: { userId: string }) => {
      setActiveUsers(prev => prev.filter(u => u.id !== data.userId));
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [chapterId, user]);

  // Only display if there are at least 2 users (including the current user)
  if (activeUsers.length < 2) return null;

  // Get the count of users excluding the current user
  const otherUsersCount = activeUsers.filter(u => u.id !== user?.id).length;
  
  // Generate names list for tooltip
  const otherUsers = activeUsers.filter(u => u.id !== user?.id);
  const namesToDisplay = otherUsers
    .map(u => u.name || 'Anonymous')
    .slice(0, 5);
  
  if (otherUsers.length > 5) {
    namesToDisplay.push(`and ${otherUsers.length - 5} more`);
  }
  
  const tooltipText = namesToDisplay.join(', ');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              "flex items-center gap-1 transition-all", 
              hasActivity ? "bg-green-500 text-white" : "bg-muted",
              className
            )}
          >
            <Users size={12} className={cn(hasActivity ? "animate-pulse" : "")} />
            <span>{activeUsers.length}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{activeUsers.length} people viewing: {tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}; 