# Gamification Enhancement Implementation Plan

This document outlines the technical implementation plan for the gamification enhancements mentioned in the gamification documentation.

## 1. Time-based Leaderboards

**Goal**: Implement weekly and monthly leaderboards in addition to the all-time leaderboard.

### Database Changes

```prisma
// Add to schema.prisma
model LeaderboardEntry {
  id            String    @id @default(uuid())
  userId        String
  user          UserProfile @relation(fields: [userId], references: [userId], onDelete: Cascade)
  points        Int
  period        String    // "weekly", "monthly", "all-time"
  weekNumber    Int?      // ISO week number (1-53)
  monthNumber   Int?      // Month number (1-12)
  year          Int       // Year
  rank          Int?      // Optional stored rank
  
  createdAt     DateTime  @default(now())

  @@unique([userId, period, weekNumber, monthNumber, year])
  @@index([period, year, weekNumber])
  @@index([period, year, monthNumber])
  @@index([userId])
}
```

### Backend Implementation

1. **Scheduled Jobs**: Create a job to calculate and store weekly/monthly leaderboards:

```typescript
// lib/gamification-service.ts
import { startOfISOWeek, endOfISOWeek, getISOWeek } from 'date-fns';

export async function updateTimeBasedLeaderboards() {
  const now = new Date();
  const year = now.getFullYear();
  const weekNumber = getISOWeek(now);
  const monthNumber = now.getMonth() + 1;
  
  // Weekly leaderboard
  const users = await db.userProfile.findMany({
    orderBy: { points: 'desc' }
  });
  
  // Create/update weekly entries
  for (let i = 0; i < users.length; i++) {
    await db.leaderboardEntry.upsert({
      where: {
        userId_period_weekNumber_monthNumber_year: {
          userId: users[i].userId,
          period: 'weekly',
          weekNumber,
          monthNumber: null,
          year
        }
      },
      update: {
        points: users[i].points,
        rank: i + 1
      },
      create: {
        userId: users[i].userId,
        period: 'weekly',
        weekNumber,
        monthNumber: null,
        year,
        points: users[i].points,
        rank: i + 1
      }
    });
  }
  
  // Similar logic for monthly leaderboard
  // ...
}
```

2. **Scheduled Job Setup**: Configure a CRON job to run the leaderboard update:

```typescript
// app/api/cron/leaderboard/route.ts
import { NextResponse } from 'next/server';
import { updateTimeBasedLeaderboards } from '@/lib/gamification-service';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await updateTimeBasedLeaderboards();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Leaderboard update failed:', error);
    return NextResponse.json({ error: 'Leaderboard update failed' }, { status: 500 });
  }
}
```

3. **API Routes**: Create endpoints to fetch time-based leaderboards:

```typescript
// app/api/leaderboard/[period]/route.ts
import { NextResponse } from 'next/server';
import { getISOWeek } from 'date-fns';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: { period: string } }
) {
  const { period } = params;
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  
  // Validate period
  if (!['weekly', 'monthly', 'all-time'].includes(period)) {
    return new NextResponse("Invalid period", { status: 400 });
  }
  
  const now = new Date();
  const year = now.getFullYear();
  const weekNumber = period === 'weekly' ? getISOWeek(now) : undefined;
  const monthNumber = period === 'monthly' ? now.getMonth() + 1 : undefined;
  
  let leaderboard;
  if (period === 'all-time') {
    leaderboard = await db.userProfile.findMany({
      take: limit,
      orderBy: { points: 'desc' },
      include: {
        earnedBadges: {
          include: { badge: true }
        }
      }
    });
  } else {
    leaderboard = await db.leaderboardEntry.findMany({
      where: {
        period,
        year,
        weekNumber: period === 'weekly' ? weekNumber : undefined,
        monthNumber: period === 'monthly' ? monthNumber : undefined,
      },
      take: limit,
      orderBy: { rank: 'asc' },
      include: {
        user: {
          include: {
            earnedBadges: {
              include: { badge: true }
            }
          }
        }
      }
    });
  }
  
  return NextResponse.json(leaderboard);
}
```

### Frontend Implementation

1. **Leaderboard Tabs**: Update the leaderboard page to include period tabs:

```tsx
// app/(dashboard)/(routes)/leaderboard/page.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LeaderboardPage = async ({ searchParams }) => {
  const period = searchParams.period || 'all-time';
  const leaderboard = await getLeaderboardByPeriod(period, 20);
  
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Leaderboard</h1>
      <p className="text-muted-foreground mb-6">Top learners ranked by points</p>

      <Tabs defaultValue={period} className="mb-6">
        <TabsList>
          <TabsTrigger value="all-time">All Time</TabsTrigger>
          <TabsTrigger value="monthly">This Month</TabsTrigger>
          <TabsTrigger value="weekly">This Week</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Top Learners</CardTitle>
          <CardDescription>
            {period === 'weekly' && "Best performers this week"}
            {period === 'monthly' && "Best performers this month"}
            {period === 'all-time' && "Best performers of all time"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Leaderboard display logic */}
        </CardContent>
      </Card>
    </div>
  );
};
```

## 2. Achievement Tiers

**Goal**: Implement bronze, silver, and gold tiers for badges based on achievement difficulty or progression.

### Database Changes

```prisma
// Update Badge model in schema.prisma
model Badge {
  id            String    @id @default(uuid())
  name          String    @unique
  description   String
  iconUrl       String
  criteria      String
  tier          String    @default("bronze") // "bronze", "silver", "gold"
  
  users         UserBadge[]

  createdAt     DateTime  @default(now())
}
```

### Backend Implementation

1. **Badge Service Updates**: Enhance the badge service to support tiers:

```typescript
// lib/badge-service.ts
export async function awardTieredBadge(userId: string, badgeName: string, tier: string = "bronze") {
  // Find the badge for the given name and tier
  const badge = await db.badge.findFirst({ 
    where: { 
      name: badgeName,
      tier
    } 
  });
  
  if (!badge) return null;

  // Check if user already has this badge
  const existingUserBadge = await db.userBadge.findUnique({
    where: { 
      userId_badgeId: { 
        userId, 
        badgeId: badge.id 
      } 
    },
  });

  if (!existingUserBadge) {
    return await db.userBadge.create({
      data: { userId, badgeId: badge.id },
      include: { badge: true }
    });
  }
  
  return null;
}

// Track progress toward badge tiers
export async function updateBadgeProgress(userId: string, badgeName: string, progress: number) {
  // Determine which tier badge to award based on progress
  let tier = "bronze";
  if (progress >= 10) tier = "silver";
  if (progress >= 25) tier = "gold";
  
  return await awardTieredBadge(userId, badgeName, tier);
}
```

2. **Badge Award Logic**: Update integrations to use tiers:

```typescript
// Example for course completion
async function handleCourseCompletion(userId: string) {
  // Count how many courses the user has completed
  const completedCourseCount = await db.course.count({
    where: {
      chapters: {
        every: {
          userProgress: {
            some: {
              userId,
              isCompleted: true
            }
          }
        }
      }
    }
  });
  
  // Award different tiers based on completion count
  if (completedCourseCount >= 1) {
    await awardTieredBadge(userId, "Course Completer", "bronze");
  }
  
  if (completedCourseCount >= 5) {
    await awardTieredBadge(userId, "Course Completer", "silver");
  }
  
  if (completedCourseCount >= 10) {
    await awardTieredBadge(userId, "Course Completer", "gold");
  }
}
```

### Frontend Implementation

1. **Badge Display Update**: Enhance the UserBadge component to show tiers:

```tsx
// components/gamification/user-badge.tsx
export const UserBadge = ({
  badge,
  size = "md"
}: UserBadgeProps) => {
  // Add tier-specific styling
  const tierStyles = {
    bronze: "border-amber-600",
    silver: "border-slate-400",
    gold: "border-yellow-500"
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center gap-1">
            <div className={`relative ${className} rounded-full overflow-hidden border-2 ${tierStyles[badge.tier]}`}>
              <Image
                src={badge.iconUrl}
                alt={badge.name}
                width={pixelSize}
                height={pixelSize}
              />
            </div>
            {size === "lg" && (
              <Badge variant="outline" className="mt-1 text-xs">
                {badge.name}
                <span className="ml-1 text-[0.6rem]">
                  {badge.tier === "gold" && "★★★"}
                  {badge.tier === "silver" && "★★"}
                  {badge.tier === "bronze" && "★"}
                </span>
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex flex-col gap-1 max-w-[200px]">
            <h3 className="font-semibold">
              {badge.name} 
              <span className="ml-1 opacity-70">
                ({badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1)})
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">{badge.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
```

## 3. Streak Tracking

**Goal**: Track daily login streaks and reward consistent platform engagement.

### Database Changes

```prisma
// Add to UserProfile model in schema.prisma
model UserProfile {
  userId           String    @id
  points           Int       @default(0)
  username         String?
  imageUrl         String?
  
  // Streak tracking
  currentStreak    Int       @default(0)
  longestStreak    Int       @default(0)
  lastLoginDate    DateTime?
  
  earnedBadges     UserBadge[]

  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}
```

### Backend Implementation

1. **Streak Service**: Create a service to manage streaks:

```typescript
// lib/streak-service.ts
import { isSameDay, addDays, differenceInDays } from 'date-fns';

export async function updateUserStreak(userId: string) {
  // Get current user profile
  const profile = await db.userProfile.findUnique({
    where: { userId }
  });
  
  if (!profile) return null;
  
  const now = new Date();
  const lastLogin = profile.lastLoginDate;
  
  // Initialize data for update
  let streakData = {
    lastLoginDate: now,
  };
  
  // No previous login - start streak
  if (!lastLogin) {
    streakData.currentStreak = 1;
    streakData.longestStreak = 1;
  } else {
    // Check if last login was yesterday
    const isYesterday = differenceInDays(now, lastLogin) === 1;
    // Check if last login was today (already logged in today)
    const isToday = isSameDay(now, lastLogin);
    
    if (isYesterday) {
      // Continue streak
      const newCurrentStreak = profile.currentStreak + 1;
      streakData.currentStreak = newCurrentStreak;
      // Update longest streak if needed
      if (newCurrentStreak > profile.longestStreak) {
        streakData.longestStreak = newCurrentStreak;
      }
    } else if (isToday) {
      // Already logged in today, don't modify streak
      return profile;
    } else {
      // Streak broken, reset to 1
      streakData.currentStreak = 1;
    }
  }
  
  // Update user profile
  const updatedProfile = await db.userProfile.update({
    where: { userId },
    data: streakData
  });
  
  // Check if streak milestones reached
  if (updatedProfile.currentStreak === 3) {
    await checkAndAwardBadge(userId, "3-Day Streak");
  }
  
  if (updatedProfile.currentStreak === 7) {
    await checkAndAwardBadge(userId, "Week Streak");
    // Award points for weekly streak
    await awardPoints(userId, 25, "7-day login streak");
  }
  
  if (updatedProfile.currentStreak === 30) {
    await checkAndAwardBadge(userId, "Month Streak");
    // Award points for monthly streak
    await awardPoints(userId, 100, "30-day login streak");
  }
  
  return updatedProfile;
}
```

2. **Integration with Authentication**: Update the middleware to track logins:

```typescript
// middleware.ts or authentication hooks
import { updateUserStreak } from "@/lib/streak-service";

// Add this to your authentication flow when user logs in
// This could be in a server action, API route, or middleware
export async function handleUserLogin(userId: string) {
  await updateUserStreak(userId);
}
```

### Frontend Implementation

1. **Streak Display**: Add a streak display component:

```tsx
// components/gamification/streak-display.tsx
import { Flame } from "lucide-react";

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
}

export const StreakDisplay = ({
  currentStreak, 
  longestStreak
}: StreakDisplayProps) => {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 text-orange-500" />
        <span className="font-medium">{currentStreak} day streak</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Longest streak: {longestStreak} days
      </p>
    </div>
  );
};
```

2. **Profile Page Integration**: Add streak to profile page:

```tsx
// In user profile page
<Card className="col-span-1">
  <CardHeader>
    <CardTitle>Your Streak</CardTitle>
    <CardDescription>Keep your learning streak alive!</CardDescription>
  </CardHeader>
  <CardContent>
    <StreakDisplay 
      currentStreak={profile?.currentStreak || 0} 
      longestStreak={profile?.longestStreak || 0}
    />
    <div className="mt-4 text-sm text-muted-foreground">
      <p>Visit daily to maintain your streak and earn rewards:</p>
      <ul className="list-disc pl-5 mt-2 space-y-1">
        <li>3-day streak: Bronze Streak badge</li>
        <li>7-day streak: Silver Streak badge + 25 points</li>
        <li>30-day streak: Gold Streak badge + 100 points</li>
      </ul>
    </div>
  </CardContent>
</Card>
```

## 4. Social Sharing

**Goal**: Allow users to share their badges and achievements on social media.

### Frontend Implementation

1. **Badge Sharing Component**:

```tsx
// components/gamification/badge-share.tsx
import { 
  FacebookShareButton, 
  TwitterShareButton, 
  LinkedinShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon
} from 'react-share';

interface BadgeShareProps {
  badge: {
    name: string;
    description: string;
    tier: string;
  };
  profileUrl: string;
}

export const BadgeShare = ({ badge, profileUrl }: BadgeShareProps) => {
  const shareTitle = `I just earned the ${badge.tier} ${badge.name} badge!`;
  const shareDescription = `${badge.description} - Check out my learning journey!`;
  
  return (
    <div className="flex flex-col space-y-3">
      <p className="text-sm font-medium">Share this achievement:</p>
      <div className="flex space-x-2">
        <TwitterShareButton
          url={profileUrl}
          title={shareTitle}
          className="rounded-full overflow-hidden"
        >
          <TwitterIcon size={32} round />
        </TwitterShareButton>
        
        <FacebookShareButton
          url={profileUrl}
          quote={shareTitle}
          className="rounded-full overflow-hidden"
        >
          <FacebookIcon size={32} round />
        </FacebookShareButton>
        
        <LinkedinShareButton
          url={profileUrl}
          title={shareTitle}
          summary={shareDescription}
          className="rounded-full overflow-hidden"
        >
          <LinkedinIcon size={32} round />
        </LinkedinShareButton>
      </div>
    </div>
  );
};
```

2. **Integration with Badge Display**:

```tsx
// Add to user-badge.tsx
import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { BadgeShare } from './badge-share';

// Inside component:
const [showShareOptions, setShowShareOptions] = useState(false);

// Add share button to the badge display
<div className="flex items-center justify-center mt-2">
  <Button 
    variant="ghost" 
    size="sm" 
    onClick={() => setShowShareOptions(!showShareOptions)}
  >
    <Share2 className="h-4 w-4 mr-1" />
    Share
  </Button>
</div>

{showShareOptions && (
  <div className="mt-2">
    <BadgeShare 
      badge={badge} 
      profileUrl={`${process.env.NEXT_PUBLIC_APP_URL}/profile/${userId}`} 
    />
  </div>
)}
```

3. **Badge Achievement Modal**:

```tsx
// components/gamification/badge-achievement-modal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BadgeShare } from "./badge-share";
import Image from 'next/image';

interface BadgeAchievementModalProps {
  badge: {
    id: string;
    name: string;
    description: string;
    iconUrl: string;
    tier: string;
  } | null;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const BadgeAchievementModal = ({
  badge,
  userId,
  isOpen,
  onClose
}: BadgeAchievementModalProps) => {
  if (!badge) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Badge Achieved!</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4">
          <div className="relative h-24 w-24 mb-4">
            <Image
              src={badge.iconUrl}
              alt={badge.name}
              fill
              className="object-contain"
            />
          </div>
          
          <h3 className="text-lg font-bold">{badge.name}</h3>
          <p className="text-sm text-center text-muted-foreground mt-1">
            {badge.description}
          </p>
          
          <div className="mt-6 w-full">
            <BadgeShare 
              badge={badge} 
              profileUrl={`${process.env.NEXT_PUBLIC_APP_URL}/profile/${userId}`} 
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

## 5. Badge Customization

**Goal**: Allow users to select favorite badges for display and customize their appearance.

### Database Changes

```prisma
// Update models
model UserProfile {
  // Existing fields...
  
  // Featured badges
  featuredBadges    String[]   // Array of badge IDs
}

model UserBadge {
  // Existing fields...
  
  // Customization
  isFavorite      Boolean   @default(false)
  displayColor    String?   // Optional custom color
}
```

### Backend Implementation

1. **Badge Management API**:

```typescript
// app/api/users/badges/favorites/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const { badgeIds } = await req.json();
    
    // Validate input
    if (!Array.isArray(badgeIds) || badgeIds.length > 5) {
      return new NextResponse("Invalid input", { status: 400 });
    }
    
    // Update user's featured badges
    const profile = await db.userProfile.update({
      where: { userId },
      data: { featuredBadges: badgeIds }
    });
    
    return NextResponse.json(profile);
  } catch (error) {
    console.error("[BADGE_FAVORITES]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
```

2. **Badge Customization API**:

```typescript
// app/api/users/badges/[badgeId]/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { db } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: { badgeId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const { badgeId } = params;
    const { isFavorite, displayColor } = await req.json();
    
    // Find the user badge
    const userBadge = await db.userBadge.findFirst({
      where: {
        badgeId,
        userId
      }
    });
    
    if (!userBadge) {
      return new NextResponse("Badge not found", { status: 404 });
    }
    
    // Update customization
    const updatedUserBadge = await db.userBadge.update({
      where: { id: userBadge.id },
      data: {
        isFavorite: isFavorite !== undefined ? isFavorite : userBadge.isFavorite,
        displayColor: displayColor !== undefined ? displayColor : userBadge.displayColor
      },
      include: { badge: true }
    });
    
    return NextResponse.json(updatedUserBadge);
  } catch (error) {
    console.error("[BADGE_CUSTOMIZATION]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
```

### Frontend Implementation

1. **Badge Management UI**:

```tsx
// app/(dashboard)/(routes)/profile/badges/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { UserBadge } from '@/components/gamification/user-badge';

export default function BadgeManagementPage() {
  const [badges, setBadges] = useState([]);
  const [featuredBadges, setFeaturedBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchBadges = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/gamification/profile');
        const data = await res.json();
        
        setBadges(data.earnedBadges || []);
        setFeaturedBadges(data.featuredBadges || []);
      } catch (error) {
        toast.error("Failed to load badges");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBadges();
  }, []);
  
  const handleDragEnd = (result) => {
    // Update badge order logic
  };
  
  const saveFeaturedBadges = async () => {
    try {
      const res = await fetch('/api/users/badges/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badgeIds: featuredBadges.map(b => b.badgeId) })
      });
      
      if (res.ok) {
        toast.success("Featured badges updated!");
      } else {
        toast.error("Failed to update badges");
      }
    } catch (error) {
      toast.error("Error saving badges");
      console.error(error);
    }
  };
  
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Badge Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-medium mb-4">Your Badges</h2>
          <div className="flex flex-wrap gap-4">
            {badges.map((badge) => (
              <UserBadge 
                key={badge.id} 
                badge={badge.badge} 
                customization={{
                  isFavorite: badge.isFavorite,
                  displayColor: badge.displayColor
                }}
                onCustomize={() => {/* Open customization modal */}}
              />
            ))}
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-medium mb-4">Featured Badges</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Drag up to 5 badges to feature on your profile
          </p>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="featured-badges">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="min-h-[200px] border-2 border-dashed rounded-md p-4"
                >
                  {featuredBadges.map((badge, index) => (
                    <Draggable key={badge.id} draggableId={badge.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <UserBadge badge={badge.badge} size="lg" />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          
          <Button 
            onClick={saveFeaturedBadges} 
            className="mt-4" 
            disabled={loading}
          >
            Save Featured Badges
          </Button>
        </div>
      </div>
    </div>
  );
}
```

## Implementation Timeline

### Phase 1: Core Enhancements (4 weeks)
- Week 1-2: Implement Time-based Leaderboards
  - Database schema updates
  - Backend services and API routes
  - Leaderboard page with period filtering

- Week 3-4: Implement Achievement Tiers
  - Database updates for badge tiers
  - Backend logic for tiered badges
  - Frontend updates for tier visualization

### Phase 2: Engagement Features (4 weeks)
- Week 5-6: Implement Streak Tracking
  - Database schema updates
  - Login tracking middleware
  - Streak display components
  - Streak rewards logic

- Week 7-8: Implement Social Sharing
  - Add react-share dependency
  - Create badge sharing components
  - Integrate sharing into badge display
  - Badge achievement modals

### Phase 3: Personalization (2 weeks)
- Week 9-10: Implement Badge Customization
  - Database schema updates
  - Badge management API
  - Badge customization UI
  - Drag and drop interface

## Testing Plan

For each feature:
1. Create unit tests for backend services
2. Create integration tests for API endpoints
3. Manual testing of user flows
4. Test edge cases (e.g., streak spanning daylight saving changes)
5. Performance testing for leaderboard calculations with large user bases 