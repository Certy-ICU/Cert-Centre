import { db } from "@/lib/db";
import { toast } from "react-hot-toast";

/**
 * Award points to a user
 * @param userId The Clerk user ID
 * @param points Number of points to award
 * @param description Optional description of the points award
 */
export async function awardPoints(userId: string, points: number, description?: string) {
  if (!userId) return null;

  try {
    // Upsert the user profile to ensure it exists
    const userProfile = await db.userProfile.upsert({
      where: { userId },
      update: { 
        points: { increment: points } 
      },
      create: { 
        userId, 
        points,
        username: null,
        imageUrl: null
      },
    });

    return userProfile;
  } catch (error) {
    console.error("Error awarding points:", error);
    return null;
  }
}

/**
 * Check if a user qualifies for a badge and award it if they do
 * @param userId The Clerk user ID
 * @param badgeName The name of the badge to check for
 * @returns The badge if awarded, null otherwise
 */
export async function checkAndAwardBadge(userId: string, badgeName: string) {
  if (!userId) return null;

  try {
    // Find the badge
    const badge = await db.badge.findUnique({ 
      where: { name: badgeName } 
    });
    
    if (!badge) {
      console.error(`Badge "${badgeName}" not found`);
      return null;
    }

    // Check if the user already has this badge
    const existingUserBadge = await db.userBadge.findUnique({
      where: { 
        userId_badgeId: { userId, badgeId: badge.id } 
      },
    });

    // If the user doesn't already have the badge, award it
    if (!existingUserBadge) {
      const userBadge = await db.userBadge.create({
        data: { 
          userId, 
          badgeId: badge.id 
        },
        include: {
          badge: true
        }
      });

      return userBadge;
    }

    return null;
  } catch (error) {
    console.error("Error checking and awarding badge:", error);
    return null;
  }
}

/**
 * Get a user's profile with their points and badges
 * @param userId The Clerk user ID
 */
export async function getUserProfile(userId: string) {
  if (!userId) return null;

  try {
    // Upsert to ensure the profile exists
    const profile = await db.userProfile.upsert({
      where: { userId },
      update: {},
      create: { 
        userId, 
        points: 0,
        username: null,
        imageUrl: null
      },
      include: {
        earnedBadges: {
          include: {
            badge: true
          }
        }
      }
    });

    return profile;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

/**
 * Get all badges in the system
 */
export async function getAllBadges() {
  try {
    return await db.badge.findMany({
      orderBy: {
        name: 'asc'
      }
    });
  } catch (error) {
    console.error("Error getting all badges:", error);
    return [];
  }
}

/**
 * Get leaderboard data
 * @param limit Number of users to include
 */
export async function getLeaderboard(limit = 10) {
  try {
    const leaderboard = await db.userProfile.findMany({
      take: limit,
      orderBy: {
        points: 'desc'
      },
      include: {
        earnedBadges: {
          include: {
            badge: true
          }
        }
      }
    });

    return leaderboard;
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    return [];
  }
} 