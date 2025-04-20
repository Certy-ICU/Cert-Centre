"use client";

import { useState, useEffect } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { LiveActivityDot } from "@/components/LiveActivityDot";

interface LiveUserData {
  id: string;
  name: string | null;
  imageUrl: string | null;
}

interface LiveCollaborationBannerProps {
  chapterId: string;
  className?: string;
}

export const LiveCollaborationBanner = ({ chapterId, className }: LiveCollaborationBannerProps) => {
  const [activeUsers, setActiveUsers] = useState<LiveUserData[]>([]);
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const channelName = `presence-chapter-${chapterId}`;
    const channel = pusherClient.subscribe(channelName);

    // Handle initial members
    channel.bind('pusher:subscription_succeeded', (data: any) => {
      const initialUsers = Object.values(data.members || {}) as LiveUserData[];
      setActiveUsers(initialUsers);
    });

    // Handle members joining
    channel.bind('pusher:member_added', (member: { id: string, info: LiveUserData }) => {
      setActiveUsers(prev => {
        if (prev.some(u => u.id === member.info.id)) return prev;
        return [...prev, member.info];
      });
    });

    // Handle members leaving
    channel.bind('pusher:member_removed', (member: { id: string }) => {
      setActiveUsers(prev => prev.filter(u => u.id !== member.id));
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [chapterId, user]);
  
  // Only show banner if there are at least 2 users (including current user)
  if (activeUsers.length < 2) return null;
  
  // Filter out current user
  const otherUsers = activeUsers.filter(u => u.id !== user?.id);
  
  if (otherUsers.length === 0) return null;

  return (
    <div 
      className={cn(
        "flex items-center justify-between w-full bg-gradient-to-r from-blue-500/10 to-green-500/10 p-2 rounded-lg mb-4",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          <LiveActivityDot className="mr-2" size="sm" />
          <span className="text-sm font-medium">Live Collaboration</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {otherUsers.length === 1 
            ? `${otherUsers[0].name || 'Someone'} is also viewing this chapter`
            : `${otherUsers.length} others are viewing this chapter`}
        </div>
      </div>
      
      <div className="flex -space-x-2">
        {otherUsers.slice(0, 5).map((activeUser) => (
          <Avatar key={activeUser.id} className="h-6 w-6 border-2 border-background">
            <AvatarImage src={activeUser.imageUrl || ''} alt={activeUser.name || 'User'} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {activeUser.name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
        ))}
        
        {otherUsers.length > 5 && (
          <Avatar className="h-6 w-6 border-2 border-background">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              +{otherUsers.length - 5}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}; 