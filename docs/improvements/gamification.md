# Implementing Gamification (Badges/Points)

This guide outlines how to add gamification elements like points, badges, and potentially leaderboards to the LMS to increase user engagement.

## 1. Define Gamification Mechanics

- **Points System**: Decide which actions grant points (e.g., completing a chapter, completing a course, posting a helpful comment, daily login).
- **Badges**: Define criteria for earning badges (e.g., "Course Completer", "First Comment", "Topic Master", "Streak Achiever"). Design or find icons for badges.
- **Levels (Optional)**: Define point thresholds for reaching different user levels.
- **Leaderboards (Optional)**: Decide if you want leaderboards (e.g., weekly points, all-time points, course-specific).

## 2. Data Model Changes (Prisma)

Update `prisma/schema.prisma` to store gamification data.

```prisma
// prisma/schema.prisma

// Add to track user points and level
model UserProfile {
  userId    String @id // Clerk User ID
  points    Int    @default(0)
  // level     Int    @default(1) // Optional

  // Optional: If syncing Clerk data
  username  String?
  imageUrl  String?

  earnedBadges UserBadge[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Define available badges
model Badge {
  id          String @id @default(uuid())
  name        String @unique
  description String
  iconUrl     String // URL to the badge icon
  criteria    String // Description of how to earn it (for display)
  // criteriaType String // Optional: For programmatic checks (e.g., "COMPLETE_COURSE", "POST_COMMENT")
  // criteriaValue Int? // Optional: e.g., number of comments needed

  users UserBadge[]

  createdAt DateTime @default(now())
}

// Track which users have earned which badges
model UserBadge {
  id        String   @id @default(uuid())
  userId    String
  user      UserProfile @relation(fields: [userId], references: [userId], onDelete: Cascade)
  badgeId   String
  badge     Badge    @relation(fields: [badgeId], references: [id], onDelete: Cascade)

  earnedAt DateTime @default(now())

  @@unique([userId, badgeId]) // User can earn each badge only once
  @@index([userId])
  @@index([badgeId])
}

// Optional: Log point-earning activities
// model PointLog {
//   id        String   @id @default(uuid())
//   userId    String
//   points    Int
//   activity  String // e.g., "COMPLETE_CHAPTER", "POST_COMMENT"
//   entityId  String? // e.g., Chapter ID or Comment ID
//   createdAt DateTime @default(now())
//
//   @@index([userId])
// }
```

- **Seed Badges**: Create initial badge definitions in your database, possibly using a Prisma seed script.
- **Apply Migrations**: Run `npx prisma generate` and `npx prisma db push` (or `migrate dev`).

## 3. Awarding Points and Badges

Modify existing API routes or create dedicated logic (e.g., helper functions, service classes) to award points and check for badges when specific actions occur.

- **Create/Update UserProfile**: Ensure a `UserProfile` record is created when a user signs up or performs their first relevant action.
- **Trigger Points/Badge Checks**: Integrate checks into relevant actions:
    - **Chapter Completion**: In the API route that handles `UserProgress` updates (`POST /api/courses/.../chapters/.../progress` ?), when `isCompleted` becomes `true`, award points and check for course completion badges.
    - **Course Completion**: Check if all chapters in a course are complete. Award points/badges.
    - **Comment Posting**: In the comment creation API (`POST /api/.../comments`), award points and check for commenting-related badges.
    - **Other Actions**: Add logic for daily logins, streaks, etc., potentially using scheduled tasks or middleware.

```typescript
// Example: Inside chapter completion logic
import { db } from "@/lib/db";

async function awardPoints(userId: string, points: number) {
  await db.userProfile.upsert({
    where: { userId },
    update: { points: { increment: points } },
    create: { userId, points },
  });
  // Optional: Log in PointLog
}

async function checkAndAwardBadge(userId: string, badgeName: string) {
  const badge = await db.badge.findUnique({ where: { name: badgeName } });
  if (!badge) return;

  const existingUserBadge = await db.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
  });

  if (!existingUserBadge) {
    await db.userBadge.create({
      data: { userId, badgeId: badge.id },
    });
    // TODO: Trigger a notification to the user (see Real-time guide)
    console.log(`User ${userId} earned badge: ${badgeName}`);
  }
}

// --- In the chapter progress update API route ---
if (updatedProgress.isCompleted) {
  await awardPoints(userId, 10); // Award 10 points for chapter completion

  // Check for course completion badge
  const courseChapters = await db.chapter.count({ where: { courseId: params.courseId, isPublished: true } });
  const completedChapters = await db.userProgress.count({
    where: { userId, chapter: { courseId: params.courseId }, isCompleted: true },
  });
  if (courseChapters === completedChapters) {
    await awardPoints(userId, 50); // Bonus points for course completion
    await checkAndAwardBadge(userId, "Course Completer");
  }
}
```

## 4. Frontend Display

- **User Profile Page**: Create or enhance a user profile/dashboard page to display:
    - Current points total.
    - Earned badges (fetch from `UserBadge` relation).
    - Optionally, current level and progress to the next level.
- **Badge Component**: A component to display a badge icon and its name/description (e.g., in the profile or as tooltips).
- **Leaderboard Component (Optional)**: If implementing leaderboards:
    - Create an API endpoint to fetch top users based on points (e.g., `GET /api/leaderboard?period=weekly`).
    - Create a component to display the leaderboard.
- **Notifications**: Use a notification system (e.g., `react-hot-toast` already in use, potentially combined with WebSockets) to inform users immediately when they earn points or badges.

## 5. API Endpoints (Read)

Create API routes to fetch gamification data for the frontend:

- **Get User Profile/Gamification Data**: `GET /api/users/me/profile` (or similar) to fetch points and earned badges for the logged-in user.
- **Get All Badges**: `GET /api/badges` to display a list of all available badges.
- **Get Leaderboard**: `GET /api/leaderboard` (as mentioned above).

## 6. Balancing and Tuning

- **Monitor Engagement**: Observe how users interact with the gamification system.
- **Adjust Points/Criteria**: Be prepared to adjust point values and badge criteria based on user feedback and engagement data to keep the system motivating but achievable.

## 7. Testing

- Test all point-awarding actions.
- Verify badge criteria logic and ensure badges are awarded correctly (and only once per user).
- Test the display of points and badges on the profile page.
- Test leaderboard logic if implemented.
- Test notifications for earning rewards. 