"use client";

import { useEffect, useState } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  imageUrl: string | null;
}

interface TypingIndicatorProps {
  chapterId: string;
  courseId: string;
}

export const TypingIndicator = ({ chapterId, courseId }: TypingIndicatorProps) => {
  const [typingUsers, setTypingUsers] = useState<User[]>([]);
  const { user } = useUser();
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (!user) return;
    console.log('TypingIndicator mounted for user:', user.id);

    // Change to use regular channel without prefix to match server implementation
    const channelName = `chapter-${chapterId}-typing`;
    
    console.log(`Using channel name: ${channelName}`);
    const channel = pusherClient.subscribe(channelName);

    // Debug subscription
    channel.bind('pusher:subscription_succeeded', () => {
      console.log('Successfully subscribed to typing channel:', channelName);
    });

    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('Failed to subscribe to typing channel:', channelName, error);
      setShowDebug(true); // Show debug info on error
    });

    // Verify connection state
    console.log('Pusher connection state:', pusherClient.connection.state);
    
    // More verbose debugging for typing events
    channel.bind('user:typing', (data: { user: User }) => {
      console.log('Received typing event:', data);
      console.log('Current typing users:', typingUsers);
      console.log('Received user ID:', data.user.id, 'Current user ID:', user.id);
      
      // Update state with the typing user
      setTypingUsers(prev => {
        // Check if user is already in the list
        if (!prev.some(u => u.id === data.user.id)) {
          console.log('Adding user to typing list:', data.user.name || 'Anonymous');
          return [...prev, data.user];
        }
        console.log('User already in typing list:', data.user.name || 'Anonymous');
        return prev;
      });
      
      // Automatically remove user after 3 seconds of inactivity
      setTimeout(() => {
        console.log('Removing user from typing list (timed out):', data.user.name || 'Anonymous');
        setTypingUsers(prev => prev.filter(u => u.id !== data.user.id));
      }, 3000);
    });

    // Cleanup
    return () => {
      console.log('TypingIndicator unmounting, cleaning up');
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [chapterId, user, typingUsers]);

  const handleTyping = async () => {
    if (!user) return;
    console.log('handleTyping called');
    
    try {
      // Log the endpoint and data for debugging
      const endpoint = `/api/courses/${courseId}/chapters/${chapterId}/typing`;
      const userData = {
        id: user.id,
        name: user.fullName || user.username || 'Anonymous',
        imageUrl: user.imageUrl
      };
      
      console.log('Sending typing indicator to:', endpoint);
      console.log('With user data:', userData);
      
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user: userData
        })
      });
      console.log('Typing indicator sent successfully');
    } catch (error) {
      console.error("Failed to send typing indicator:", error);
      setShowDebug(true); // Show debug info on error
    }
  };

  // Only show typing indicator if other users are typing
  const otherTypingUsers = typingUsers.filter(typingUser => typingUser.id !== user?.id);
  
  console.log('Other typing users:', otherTypingUsers.length, otherTypingUsers);
  
  // Debug panel - can be toggled by clicking on the typing indicator
  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };
  
  if (otherTypingUsers.length === 0) {
    console.log('No users typing, not showing indicator');
    return null;
  }

  console.log('Rendering typing indicator, users typing:', otherTypingUsers.length);
  return (
    <div 
      className="w-full mb-3 transition-all duration-300 ease-in-out" 
      onClick={toggleDebug}
    >
      <div className="flex items-center space-x-2 text-sm text-muted-foreground rounded-lg p-2 bg-secondary/30 animate-pulse">
        <div className="flex -space-x-2">
          {otherTypingUsers.slice(0, 3).map((typingUser) => (
            <Avatar key={typingUser.id} className="h-6 w-6 border-2 border-background">
              <AvatarImage src={typingUser.imageUrl || ''} alt={typingUser.name || ''} />
              <AvatarFallback>
                {typingUser.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        <div className="flex items-center">
          <span className="mr-2">
            {otherTypingUsers.length === 1 
              ? `${otherTypingUsers[0].name || 'Someone'} is typing...` 
              : `${otherTypingUsers.length} people are typing...`}
          </span>
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 bg-foreground/70 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-1.5 h-1.5 bg-foreground/70 rounded-full animate-bounce" style={{ animationDelay: "200ms" }}></div>
            <div className="w-1.5 h-1.5 bg-foreground/70 rounded-full animate-bounce" style={{ animationDelay: "400ms" }}></div>
          </div>
        </div>
      </div>
      
      {showDebug && (
        <div className="mt-1 text-xs p-2 bg-black/80 text-white rounded-md">
          <div>Pusher connection: {pusherClient.connection.state}</div>
          <div>Channel: chapter-{chapterId}-typing</div>
          <div>Typing users: {typingUsers.map(u => u.name || 'Anonymous').join(', ')}</div>
        </div>
      )}
    </div>
  );
};

// Export the typing handler to use in the comment input
export const useTypingHandler = (chapterId: string, courseId: string) => {
  const { user } = useUser();
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleTyping = () => {
    if (!user) return;
    console.log('useTypingHandler: handleTyping called');
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Send typing indicator
    console.log('useTypingHandler: Sending typing indicator');
    
    const userData = {
      id: user.id,
      name: user.fullName || user.username || 'Anonymous',
      imageUrl: user.imageUrl
    };
    
    fetch(`/api/courses/${courseId}/chapters/${chapterId}/typing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user: userData })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => console.log('useTypingHandler: Typing indicator sent successfully', data))
    .catch(error => console.error('useTypingHandler: Failed to send typing indicator:', error));
    
    // Set new timeout
    const timeout = setTimeout(() => {
      console.log('useTypingHandler: Typing timeout cleared');
      setTypingTimeout(null);
    }, 2000);
    
    setTypingTimeout(timeout);
  };

  return handleTyping;
}; 