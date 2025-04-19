"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trophy, Medal, Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserBadge } from '@/components/gamification/user-badge';
import { PointsDisplay } from '@/components/gamification/points-display';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Type definitions
export type LeaderboardPeriod = 'weekly' | 'monthly' | 'allTime';

export interface LeaderboardUser {
  id: string;
  name: string;
  avatarUrl: string;
  points: number;
  position: number;
  tier?: 'bronze' | 'silver' | 'gold';
  isCurrentUser?: boolean;
  streak?: number;
  badges?: {
    id: string;
    name: string;
    iconUrl: string;
    tier?: 'bronze' | 'silver' | 'gold';
  }[];
}

interface LeaderboardProps {
  users: LeaderboardUser[];
  period?: LeaderboardPeriod;
  defaultPeriod?: LeaderboardPeriod;
  currentUserId?: string;
  loading?: boolean;
  className?: string;
  title?: string;
  description?: string;
  onPeriodChange?: (period: LeaderboardPeriod) => void;
  maxUsers?: number;
}

export function Leaderboard({
  users = [],
  period,
  defaultPeriod = 'weekly',
  currentUserId,
  loading = false,
  className,
  title = 'Leaderboard',
  description = 'See who's leading the way',
  onPeriodChange,
  maxUsers = 10
}: LeaderboardProps) {
  const [expanded, setExpanded] = useState(false);
  const [activePeriod, setActivePeriod] = useState<LeaderboardPeriod>(defaultPeriod);
  
  // Find current user
  const currentUser = users.find(user => user.id === currentUserId);
  
  // Prepare users to display
  const displayUsers = expanded ? users : users.slice(0, maxUsers);
  
  // Handle period change
  const handlePeriodChange = (value: string) => {
    const newPeriod = value as LeaderboardPeriod;
    setActivePeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };
  
  // Get period icon
  const getPeriodIcon = (periodType: LeaderboardPeriod) => {
    switch (periodType) {
      case 'weekly':
        return <Calendar className="h-4 w-4" />;
      case 'monthly':
        return <Clock className="h-4 w-4" />;
      case 'allTime':
        return <Trophy className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };
  
  // Get position styling
  const getPositionStyle = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 2:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 3:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      default:
        return 'bg-background text-muted-foreground';
    }
  };
  
  // Get position icon
  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
      case 3:
        return <Medal className="h-4 w-4 text-amber-600 dark:text-amber-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        
        {period && (
          <Tabs 
            value={activePeriod} 
            onValueChange={handlePeriodChange}
            className="mt-2"
          >
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="weekly" className="flex items-center gap-1.5">
                {getPeriodIcon('weekly')}
                <span>Weekly</span>
              </TabsTrigger>
              <TabsTrigger value="monthly" className="flex items-center gap-1.5">
                {getPeriodIcon('monthly')}
                <span>Monthly</span>
              </TabsTrigger>
              <TabsTrigger value="allTime" className="flex items-center gap-1.5">
                {getPeriodIcon('allTime')}
                <span>All Time</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </CardHeader>
      
      <CardContent className="px-2 pt-0">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-pulse space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div 
                  key={i} 
                  className="h-12 bg-muted rounded-md w-full md:w-[400px]"
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {users.length > 0 ? (
              <ScrollArea className="h-[320px] pr-3">
                <div className="space-y-1">
                  {displayUsers.map((user) => (
                    <div 
                      key={user.id}
                      className={cn(
                        "flex items-center p-2 rounded-md",
                        user.isCurrentUser ? "bg-accent" : "hover:bg-accent/50"
                      )}
                    >
                      <div className={cn(
                        "flex justify-center items-center w-8 h-8 rounded-full font-semibold text-sm mr-3",
                        getPositionStyle(user.position)
                      )}>
                        {getPositionIcon(user.position) || user.position}
                      </div>
                      
                      <div className="relative w-8 h-8 rounded-full overflow-hidden mr-3">
                        <Image 
                          src={user.avatarUrl} 
                          alt={user.name} 
                          fill 
                          className="object-cover"
                        />
                      </div>
                      
                      <div className="flex flex-col flex-grow min-w-0">
                        <div className="flex items-center">
                          <Link 
                            href={`/profile/${user.id}`}
                            className="font-medium text-sm hover:underline truncate"
                          >
                            {user.name}
                          </Link>
                          
                          {user.tier && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="ml-1.5">
                                    <UserBadge 
                                      badge={{
                                        id: user.id,
                                        name: user.tier,
                                        tier: user.tier,
                                        iconUrl: ''
                                      }}
                                      size="sm"
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{user.tier.charAt(0).toUpperCase() + user.tier.slice(1)} Tier</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          
                          {user.isCurrentUser && (
                            <span className="ml-1.5 text-xs text-muted-foreground">(You)</span>
                          )}
                        </div>
                        
                        {user.badges && user.badges.length > 0 && (
                          <div className="flex mt-1 -space-x-1.5">
                            {user.badges.slice(0, 3).map((badge) => (
                              <UserBadge
                                key={badge.id}
                                badge={badge}
                                size="xs"
                              />
                            ))}
                            
                            {user.badges.length > 3 && (
                              <div className="flex items-center justify-center bg-muted text-xs text-muted-foreground rounded-full w-5 h-5">
                                +{user.badges.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {user.streak && user.streak > 1 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center text-xs font-medium text-orange-600 dark:text-orange-400">
                                  <span>🔥</span>
                                  <span>{user.streak}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{user.streak} day streak</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        
                        <PointsDisplay points={user.points} size="sm" showLabel={false} />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No data yet</h3>
                <p className="text-muted-foreground">
                  The leaderboard will populate as users earn points
                </p>
              </div>
            )}
          </>
        )}
        
        {users.length > maxUsers && (
          <div className="mt-2 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-xs flex items-center gap-1"
            >
              {expanded ? (
                <>
                  <span>Show less</span>
                  <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  <span>Show all ({users.length})</span>
                  <ChevronDown className="h-3 w-3" />
                </>
              )}
            </Button>
          </div>
        )}
        
        {currentUser && currentUser.position > maxUsers && !expanded && (
          <div className="mt-2 pt-2 border-t">
            <div 
              className={cn(
                "flex items-center p-2 rounded-md bg-accent"
              )}
            >
              <div className={cn(
                "flex justify-center items-center w-8 h-8 rounded-full font-semibold text-sm mr-3",
                "bg-background text-muted-foreground"
              )}>
                {currentUser.position}
              </div>
              
              <div className="relative w-8 h-8 rounded-full overflow-hidden mr-3">
                <Image 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.name} 
                  fill 
                  className="object-cover"
                />
              </div>
              
              <div className="flex flex-col flex-grow min-w-0">
                <div className="flex items-center">
                  <Link 
                    href={`/profile/${currentUser.id}`}
                    className="font-medium text-sm hover:underline truncate"
                  >
                    {currentUser.name}
                  </Link>
                  <span className="ml-1.5 text-xs text-muted-foreground">(You)</span>
                </div>
              </div>
              
              <PointsDisplay points={currentUser.points} size="sm" showLabel={false} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 