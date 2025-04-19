# Gamification Features Documentation

This document provides an overview of the gamification features implemented in the Cert Centre platform, based on the implementation plan in `docs/improvements/gamification-implementation-plan.md`.

## Overview

The gamification system enhances user engagement through the following core elements:

- **Points**: Numeric rewards for user actions
- **Badges**: Visual achievements with tiered levels (bronze, silver, gold)
- **Streaks**: Tracking of daily logins and consistent platform usage
- **Leaderboards**: Time-based rankings (weekly, monthly, all-time)
- **Social Sharing**: Ability to share achievements on social platforms

## 1. Badge System

### 1.1 Badge Tiers

Badges come in three tiers, each representing a level of achievement:

- **Bronze**: Entry-level achievements (e.g., completing 1 course)
- **Silver**: Intermediate achievements (e.g., completing 5 courses)
- **Gold**: Advanced achievements (e.g., completing 10 courses)

### 1.2 Badge Achievement Modal

When users earn a new badge, a celebratory modal appears with:

- Badge image and tier
- Congratulatory message
- Description of the achievement
- Social sharing options
- Confetti animation effect

**Implementation**: `components/gamification/badge-achievement-modal.tsx`

### 1.3 Badge Management UI

Users can manage their badges through a dedicated interface:

- View all earned badges by tier
- Feature up to 5 badges on their profile
- Drag-and-drop interface for selecting featured badges
- Filter badges by tier (bronze, silver, gold)

**Implementation**: `app/(dashboard)/(routes)/profile/badges/page.tsx`

## 2. Streak Tracking

The system tracks users' daily logins and rewards consistent engagement:

### 2.1 Streak Mechanics

- Streaks increment by 1 for consecutive daily logins
- Streaks reset if a user misses a day
- Streak milestones (3, 7, 30 days) award special badges

### 2.2 Streak Display Component

A visual component shows:

- Current streak count
- Longest streak achieved
- Progress toward next milestone
- Visual indicator (flame icon)

**Implementation**: `components/gamification/streak-display.tsx`

### 2.3 Streak Tracking Middleware

The middleware layer handles:

- Detecting user logins
- Updating streak counts
- Awarding streak badges at milestones
- Points rewards for maintaining streaks

**Implementation**: `middleware.ts` and `lib/streak-service.ts`

## 3. Time-based Leaderboards

Users compete on various timeframes:

### 3.1 Leaderboard Types

- **Weekly**: Resets each week, shows top performers for current week
- **Monthly**: Resets each month, shows top performers for current month
- **All-time**: Persistent leaderboard showing overall points leaders

### 3.2 Leaderboard Display Page

The leaderboard page shows:

- User rankings with avatars and points
- Badges earned by top users
- Tabs to switch between timeframes

**Implementation**: `app/(dashboard)/(routes)/leaderboard/page.tsx`

## 4. Social Sharing

Users can share their achievements on social media:

### 4.1 Sharing Features

- Share badges on Twitter, Facebook, and LinkedIn
- Custom share messages including badge tier and name
- Link back to user's profile

**Implementation**: `components/gamification/badge-share.tsx`

## 5. User Profile Enhancements

The user profile showcases gamification elements:

### 5.1 Profile Components

- Points display with visual indicator of level
- Featured badges section
- Current streak display
- Achievement progress tracking

**Implementation**: `app/(dashboard)/(routes)/profile/page.tsx`

## 6. API Endpoints

### 6.1 Gamification API Routes

- `/api/gamification/profile`: User's gamification data
- `/api/gamification/badges/latest`: Most recently earned badge
- `/api/users/badges/favorites`: Manage featured badges
- `/api/users/badges/[badgeId]`: Customize individual badges

## 7. Backend Services

### 7.1 Core Services

- **Points Service**: Award and track points (`lib/gamification-service.ts`)
- **Badge Service**: Award badges based on achievements (`lib/badge-service.ts`)
- **Streak Service**: Track daily logins (`lib/streak-service.ts`)
- **Leaderboard Service**: Maintain time-based rankings (`lib/gamification-service.ts`)

## 8. Database Schema

The gamification system extends the database with models for:

- `UserProfile`: Points, streaks, and user data
- `Badge`: Available achievements with tiers
- `UserBadge`: Junction model tracking earned badges
- `LeaderboardEntry`: Time-based rankings

## 9. Context Providers

### 9.1 Badge Achievement Provider

A React context that:

- Detects newly earned badges
- Shows achievement modals
- Manages seen status to prevent duplicates

**Implementation**: `providers/badge-achievement-provider.tsx`

## Usage Example

```typescript
// Award points to a user
await awardPoints(userId, 10, "Completed a chapter");

// Check and award a badge
await checkAndAwardBadge(userId, "Course Completer", "bronze");

// Update a user's streak on login
await updateUserStreak(userId);
```

## Implementation Notes

1. The streak tracking logic runs in the middleware to capture all user visits
2. Badge achievement modals use localStorage to prevent showing the same badge twice
3. Featured badges are stored as a JSON string in the database since MySQL doesn't support arrays
4. Leaderboards are updated periodically through a background job

## Future Enhancements

Potential areas for expansion:

1. Challenge system for time-limited goals
2. Group/team competitions
3. Virtual currency rewards
4. Customizable badge display preferences
5. Achievement notification history 