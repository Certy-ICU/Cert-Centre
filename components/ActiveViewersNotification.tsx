"use client";

import { useState, useEffect } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  id: string;
  name: string | null;
  imageUrl: string | null;
}

interface ActiveViewersNotificationProps {
  chapterId: string;
}

export const ActiveViewersNotification = ({ chapterId }: ActiveViewersNotificationProps) => {
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const channelName = `presence-chapter-${chapterId}`;
    const channel = pusherClient.subscribe(channelName);

    // When a new member joins, show notification
    channel.bind('pusher:member_added', (member: { id: string, info: User }) => {
      console.log('New viewer joined:', member.info);
      
      // Don't add duplicates and don't include the current user
      setActiveUsers(prev => {
        if (prev.some(u => u.id === member.info.id) || member.info.id === user.id) return prev;
        return [...prev, member.info];
      });
      
      // Show notification
      setShowNotification(true);
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    });
    
    // Handle initial members on subscription success
    channel.bind('pusher:subscription_succeeded', (data: any) => {
      const initialUsers = Object.values(data.members || {}) as User[];
      
      // Filter out the current user
      const otherUsers = initialUsers.filter(u => u.id !== user.id);
      console.log('Initial users viewing this chapter:', otherUsers);
      
      if (otherUsers.length > 0) {
        setActiveUsers(otherUsers);
        setShowNotification(true);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      }
    });

    // Remove members when they leave
    channel.bind('pusher:member_removed', (member: { id: string }) => {
      console.log('Viewer left:', member.id);
      setActiveUsers(prev => prev.filter(u => u.id !== member.id));
    });
    
    // Listen for custom active events too
    channel.bind('user:active', (data: { user: User }) => {
      // Don't add duplicates and don't include the current user
      if (data.user.id === user.id) return;
      
      setActiveUsers(prev => {
        if (prev.some(u => u.id === data.user.id)) return prev;
        
        setShowNotification(true);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
        
        return [...prev, data.user];
      });
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [chapterId, user]);

  // Don't show anything if there are no other users or the notification is hidden
  if (activeUsers.length === 0 || !showNotification) return null;

  // Get the name of the first user or a count of users
  const userText = activeUsers.length === 1
    ? `${activeUsers[0].name || 'Someone'} joined`
    : `${activeUsers.length} people are viewing`;

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-white dark:bg-gray-800 rounded-full shadow-lg px-4 py-2 flex items-center space-x-2 border border-green-500">
            <div className="flex -space-x-2">
              {activeUsers.slice(0, 3).map((activeUser) => (
                <Avatar key={activeUser.id} className="h-8 w-8 border-2 border-background animate-pulse">
                  <AvatarImage src={activeUser.imageUrl || ''} alt={activeUser.name || 'Viewer'} />
                  <AvatarFallback className="bg-green-500 text-white">
                    {activeUser.name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <div className="text-sm font-medium">
              {userText} this chapter
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 