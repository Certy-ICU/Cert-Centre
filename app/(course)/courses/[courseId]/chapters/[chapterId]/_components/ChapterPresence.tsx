"use client";

import { useEffect, useState } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  name: string | null;
  imageUrl: string | null;
}

interface ChapterPresenceProps {
  chapterId: string;
}

export const ChapterPresence = ({ chapterId }: ChapterPresenceProps) => {
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [channelSubscribed, setChannelSubscribed] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;
    console.log('ChapterPresence mounted for user:', user.id);

    const currentUser = {
      id: user.id,
      name: user.fullName || user.username || 'Anonymous',
      imageUrl: user.imageUrl
    };

    // Use a presence channel
    const channelName = `presence-chapter-${chapterId}`;
    console.log('Subscribing to presence channel:', channelName);
    console.log('Pusher connection state:', pusherClient.connection.state);
    
    // Debug Pusher connection
    pusherClient.connection.bind('state_change', (states: {previous: string; current: string}) => {
      console.log(`Pusher connection state changed: ${states.previous} -> ${states.current}`);
      
      // If we get disconnected, show debug info
      if (states.current === 'disconnected' || states.current === 'failed') {
        setShowDebug(true);
      }
    });
    
    // Subscribe to the channel
    const channel = pusherClient.subscribe(channelName);

    // Announce current user's presence
    const announcePresence = async () => {
      try {
        console.log('Announcing presence for user:', user.id);
        const response = await fetch(`/api/courses/chapters/${chapterId}/presence`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ user: currentUser })
        });
        
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Failed to announce presence: ${response.status} ${text}`);
        }
        
        console.log('Presence announced successfully');
      } catch (error) {
        console.error("Failed to announce presence:", error);
        setShowDebug(true); // Show debug panel on error
      }
    };

    // Only announce presence if we're connected and subscribed
    pusherClient.connection.bind('connected', () => {
      console.log('Pusher connection established, announcing presence');
      announcePresence();
    });

    // Debug subscription events
    channel.bind('pusher:subscription_succeeded', (data: any) => {
      console.log('Presence subscription successful:', data);
      setChannelSubscribed(true);
      
      const memberCount = Object.keys(data.members || {}).length;
      console.log(`Initial members count: ${memberCount}`);
      
      const initialUsers = Object.values(data.members || {}) as User[];
      console.log('Initial presence members:', initialUsers);
      setActiveUsers(initialUsers);
      
      // Announce presence after successful subscription
      announcePresence();
    });

    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('Presence subscription error:', error);
      setChannelSubscribed(false);
      setShowDebug(true); // Show debug panel on subscription error
    });

    // Handle users joining
    channel.bind('pusher:member_added', (member: { id: string, info: User }) => {
      console.log('Member added to presence channel:', member);
      console.log('Member info:', member.info);
      setActiveUsers(prev => {
        if (prev.some(u => u.id === member.info.id)) {
          console.log('Member already exists in active users list');
          return prev;
        }
        return [...prev, member.info];
      });
    });

    channel.bind('pusher:member_removed', (member: { id: string }) => {
      console.log('Member removed from presence channel:', member);
      setActiveUsers(prev => prev.filter(user => user.id !== member.id));
    });

    // Listen for custom events too
    channel.bind('user:active', (data: { user: User }) => {
      console.log('User active event received:', data);
      // Add the user to our list if they're not already there
      setActiveUsers(prev => {
        if (prev.some(u => u.id === data.user.id)) return prev;
        return [...prev, data.user];
      });
    });

    channel.bind('user:inactive', (data: { userId: string }) => {
      console.log('User inactive event received:', data);
      setActiveUsers(prev => prev.filter(user => user.id !== data.userId));
    });

    // Cleanup
    const pingIntervalId = setInterval(() => {
      if (channelSubscribed) {
        announcePresence();
      }
    }, 30000); // Keep alive every 30 seconds

    return () => {
      console.log('ChapterPresence unmounting, cleaning up');
      clearInterval(pingIntervalId);
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
      pusherClient.connection.unbind('connected');
      pusherClient.connection.unbind('state_change');
      
      // Announce departure
      fetch(`/api/courses/chapters/${chapterId}/presence`, {
        method: 'DELETE'
      }).catch(console.error);
    };
  }, [chapterId, user, channelSubscribed]);

  // Debug current state
  console.log('Current active users:', activeUsers);
  console.log('Current user:', user?.id);
  console.log('Filtered active users:', activeUsers.filter(activeUser => activeUser.id !== user?.id));

  const otherActiveUsers = activeUsers.filter(activeUser => activeUser.id !== user?.id);
  
  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };
  
  if (otherActiveUsers.length === 0) {
    console.log('Not showing presence UI, no other active users');
    
    // Show debug panel even if no users are active
    if (showDebug) {
      return (
        <div className="mb-4">
          <div className="p-2 bg-black/80 text-white text-xs rounded-md">
            <div>Pusher connection: {pusherClient.connection.state}</div>
            <div>Channel: presence-chapter-{chapterId}</div>
            <div>Subscribed: {channelSubscribed ? 'Yes' : 'No'}</div>
            <div>No other users currently viewing</div>
          </div>
        </div>
      );
    }
    
    return null;
  }

  console.log('Rendering presence UI, other active users:', otherActiveUsers.length);
  return (
    <div 
      className="mb-4 cursor-pointer"
      onClick={toggleDebug}
    >
      <div className="flex items-center mb-1">
        <Badge variant="secondary" className="mr-2 px-2 py-1">LIVE</Badge>
        <span className="text-sm text-muted-foreground mr-2">
          {otherActiveUsers.length === 1 
            ? "1 person also viewing" 
            : `${otherActiveUsers.length} people also viewing`}
        </span>
        <div className="flex -space-x-2">
          <TooltipProvider>
            {otherActiveUsers.slice(0, 5).map((activeUser) => (
              <Tooltip key={activeUser.id}>
                <TooltipTrigger asChild>
                  <Avatar className="h-7 w-7 border-2 border-background ring-2 ring-green-500 ring-offset-1">
                    <AvatarImage src={activeUser.imageUrl || ''} alt={activeUser.name || ''} />
                    <AvatarFallback>
                      {activeUser.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{activeUser.name || 'Anonymous'}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
          
          {otherActiveUsers.length > 6 && (
            <Avatar className="h-7 w-7 border-2 border-background">
              <AvatarFallback>+{otherActiveUsers.length - 6}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
      
      {showDebug && (
        <div className="p-2 bg-black/80 text-white text-xs rounded-md">
          <div>Pusher connection: {pusherClient.connection.state}</div>
          <div>Channel: presence-chapter-{chapterId}</div>
          <div>Subscribed: {channelSubscribed ? 'Yes' : 'No'}</div>
          <div>Active users: {activeUsers.length}</div>
          <div>
            Users: {activeUsers.map(u => 
              `${u.name || 'Anonymous'}${u.id === user?.id ? ' (you)' : ''}`
            ).join(', ')}
          </div>
        </div>
      )}
    </div>
  );
}; 