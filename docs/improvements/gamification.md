# Gamification System Documentation

## Overview

The gamification system enhances user engagement through points, badges, levels, and leaderboards. This document outlines the architecture, implementation, and usage of these features within the learning platform.

## 1. System Architecture

### 1.1 Core Components

The gamification system consists of the following core elements:

| Component | Description |
|-----------|-------------|
| Points | Numeric rewards for user actions (completing chapters, courses, posting comments) |
| Badges | Visual achievements awarded for specific accomplishments |
| Levels | Progression tiers based on accumulated points |
| Leaderboards | Rankings showing top users based on points |

### 1.2 Reward Mechanics

| Action | Points | Badge Eligibility |
|--------|--------|-------------------|
| Complete Chapter | 10 | - |
| Complete Course | 50 (bonus) | "Course Completer" |
| Post Comment | 5 | "Engaged Learner" (first comment) |
| Start Discussion | 5 | - |
| Daily Login | 1 | "Streak Master" (7 consecutive days) |

## 2. Data Model

The gamification system extends the existing database schema with the following models:

```prisma
// User profile - Stores points and level information
model UserProfile {
  userId        String    @id                  // Clerk User ID
  points        Int       @default(0)          // Accumulated points
  username      String?                        // Optional: From Clerk data
  imageUrl      String?                        // Optional: From Clerk data
  earnedBadges  UserBadge[]                    // Relation to earned badges
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

// Badges - Defines available achievements
model Badge {
  id            String    @id @default(uuid())
  name          String    @unique              // Unique badge name
  description   String                         // Badge description
  iconUrl       String                         // URL to badge icon
  criteria      String                         // How to earn (display text)
  users         UserBadge[]                    // Relation to users who earned
  createdAt     DateTime  @default(now())
}

// User-Badge junction - Tracks which users earned which badges
model UserBadge {
  id            String    @id @default(uuid())
  userId        String
  user          UserProfile @relation(fields: [userId], references: [userId], onDelete: Cascade)
  badgeId       String
  badge         Badge     @relation(fields: [badgeId], references: [id], onDelete: Cascade)
  earnedAt      DateTime  @default(now())

  @@unique([userId, badgeId])                  // User can earn each badge only once
  @@index([userId])
  @@index([badgeId])
}
```

## 3. Implementation Guide

### 3.1 Database Setup

1. Add the models to your `prisma/schema.prisma` file
2. Generate Prisma client and apply migrations:

```bash
# Generate types
pnpm prisma generate

# Apply database changes
pnpm prisma migrate dev --name add_gamification
```

3. Seed initial badge data in your seed script

### 3.2 Backend Services

Create utility functions to manage points and badges:

```typescript
// Award points to a user
export async function awardPoints(userId: string, points: number) {
  await db.userProfile.upsert({
    where: { userId },
    update: { points: { increment: points } },
    create: { userId, points },
  });
}

// Check criteria and award badge if not already earned
export async function checkAndAwardBadge(userId: string, badgeName: string) {
  const badge = await db.badge.findUnique({ where: { name: badgeName } });
  if (!badge) return;

  const existingUserBadge = await db.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
  });

  if (!existingUserBadge) {
    await db.userBadge.create({
      data: { userId, badgeId: badge.id },
    });
  }
}

// Get user profile with points and badges
export async function getUserProfile(userId: string) {
  return await db.userProfile.findUnique({
    where: { userId },
    include: {
      earnedBadges: {
        include: { badge: true }
      }
    }
  });
}

// Get leaderboard of top users
export async function getLeaderboard(limit = 10) {
  return await db.userProfile.findMany({
    take: limit,
    orderBy: { points: 'desc' },
    include: {
      earnedBadges: {
        include: { badge: true }
      }
    }
  });
}
```

### 3.3 Integration Points

Integrate gamification into existing actions:

#### Chapter Completion

```typescript
// In chapter progress update API route
if (updatedProgress.isCompleted) {
  // Award points for chapter completion
  await awardPoints(userId, 10);
  
  // Check for course completion
  const courseChapters = await db.chapter.count({ 
    where: { courseId: params.courseId, isPublished: true } 
  });
  
  const completedChapters = await db.userProgress.count({
    where: { 
      userId, 
      chapter: { courseId: params.courseId }, 
      isCompleted: true 
    },
  });
  
  if (courseChapters === completedChapters) {
    // Award bonus points and badge for course completion
    await awardPoints(userId, 50);
    await checkAndAwardBadge(userId, "Course Completer");
  }
}
```

## 4. Frontend Components

### 4.1 Core Components

1. **UserProfileAvatar**: Enhanced avatar with level indicator
2. **BadgesDisplay**: Grid of earned badges with tooltips
3. **PointsDisplay**: Shows user points with award icon
4. **Notifications**: Toast notifications for earned rewards

### 4.2 Pages

1. **Profile Page**: Shows user's points, level, and earned badges
2. **Leaderboard Page**: Ranks users by points with their badges and levels

## 5. API Endpoints

Create API routes to fetch gamification data:

1. **GET /api/gamification/profile**: Fetch current user's profile with points and badges
2. **GET /api/badges**: List all available badges
3. **GET /api/leaderboard**: Get top users ranked by points

## 6. Testing Checklist

- [ ] Points awarded for completing chapters (10 points)
- [ ] Bonus points awarded for completing courses (50 points)
- [ ] Points awarded for posting comments (5 points)
- [ ] Badges awarded only once per user
- [ ] Profile page shows correct points and badges
- [ ] Leaderboard correctly ranks users
- [ ] Notifications appear when rewards are earned

## 7. Future Enhancements

1. **Time-based Leaderboards**: Weekly/monthly rankings
2. **Achievement Tiers**: Bronze/silver/gold badge levels
3. **Streaks**: Track daily login streaks
4. **Social Sharing**: Share badges on social media
5. **Customization**: Select badge display preferences 