"use client";

import { useEffect, useState } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users } from "lucide-react";

interface ActiveViewersProps {
  courseId: string;
  chapterId: string;
}

type Viewer = {
  id: string;
  name: string;
  imageUrl: string;
};

export const ActiveViewers = ({
  courseId,
  chapterId,
}: ActiveViewersProps) => {
  const [viewers, setViewers] = useState<Record<string, Viewer>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    
    const channelName = `presence-chapter-${courseId}-${chapterId}`;
    
    const channel = pusherClient.subscribe(channelName);
    
    channel.bind("pusher:subscription_succeeded", (members: any) => {
      setIsLoading(false);
      
      // Initialize members
      const initialMembers: Record<string, Viewer> = {};
      members.each((member: Viewer) => {
        initialMembers[member.id] = member;
      });
      
      setViewers(initialMembers);
    });
    
    channel.bind("pusher:member_added", (member: any) => {
      setViewers((prev) => ({
        ...prev,
        [member.id]: member.info,
      }));
    });
    
    channel.bind("pusher:member_removed", (member: any) => {
      setViewers((prev) => {
        const updated = { ...prev };
        delete updated[member.id];
        return updated;
      });
    });
    
    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [courseId, chapterId]);
  
  const viewersCount = Object.keys(viewers).length;
  
  if (isLoading) {
    return null;
  }
  
  if (viewersCount === 0) {
    return null;
  }
  
  return (
    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex -space-x-2 overflow-hidden">
              {Object.values(viewers).slice(0, 3).map((viewer) => (
                <Avatar key={viewer.id} className="border-2 border-background w-7 h-7">
                  <AvatarImage src={viewer.imageUrl} alt={viewer.name} />
                  <AvatarFallback className="text-xs">
                    {viewer.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
              ))}
              {viewersCount > 3 && (
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs border-2 border-background">
                  +{viewersCount - 3}
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="font-medium text-sm">Active Viewers</p>
            <ul className="mt-1 text-xs">
              {Object.values(viewers).map((viewer) => (
                <li key={viewer.id}>{viewer.name}</li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Badge variant="secondary" className="ml-1">
        <Users className="h-3 w-3 mr-1" />
        {viewersCount} {viewersCount === 1 ? "viewer" : "viewers"}
      </Badge>
    </div>
  );
}; 