import { db } from "@/lib/db";
import { toast } from "react-hot-toast";
import { format, getISOWeek, getMonth, getYear } from "date-fns";
import { clerkClient } from "@clerk/nextjs";
import { UserProfile, Badge, UserBadge } from "@prisma/client";

export type BadgeWithDetails = Badge & {
  earnedDate?: Date;
};

export type UserBadgeWithBadge = UserBadge & {
  badge: Badge;
};

export type UserProfileWithBadges = UserProfile & {
  earnedBadges: UserBadgeWithBadge[];
  featuredBadges?: string[];
};

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
 * Sync user profile with Clerk data
 * @param userId The Clerk user ID
 */
export async function syncUserProfile(userId: string) {
  if (!userId) return null;

  try {
    // Fetch user data from Clerk
    const user = await clerkClient.users.getUser(userId);
    
    if (!user) {
      console.error("User not found in Clerk:", userId);
      return null;
    }

    // Extract username and image from Clerk user data
    const username = user.username || 
                     `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
                     user.emailAddresses[0]?.emailAddress?.split('@')[0] || 
                     `User-${userId.substring(0, 5)}`;
    
    const imageUrl = user.imageUrl;

    // Update the user profile with Clerk data
    const profile = await db.userProfile.upsert({
      where: { userId },
      update: { 
        username,
        imageUrl
      },
      create: { 
        userId, 
        points: 0,
        username,
        imageUrl,
        currentStreak: 0,
        longestStreak: 0
      },
      include: {
        earnedBadges: {
          include: {
            badge: true
          }
        }
      }
    });

    // Parse featured badges from JSON
    let featuredBadges: string[] = [];
    if (profile.featuredBadgesJson) {
      try {
        featuredBadges = JSON.parse(profile.featuredBadgesJson);
      } catch (e) {
        console.error("Error parsing featuredBadgesJson", e);
      }
    }

    return {
      ...profile,
      featuredBadges
    };
  } catch (error) {
    console.error("Error syncing user profile:", error);
    return null;
  }
}

/**
 * Get a user's profile with their points and badges
 * @param userId The Clerk user ID
 */
export async function getUserProfile(userId: string): Promise<UserProfileWithBadges | null> {
  try {
    const profile = await db.userProfile.findUnique({
      where: { userId },
      include: {
        earnedBadges: {
          include: {
            badge: true,
          },
          orderBy: {
            earnedAt: 'desc',
          },
        },
      },
    });

    return profile;
  } catch (error) {
    console.error("Error fetching user profile:", error);
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
 * Updates the weekly and monthly leaderboards
 */
export async function updateTimeBasedLeaderboards() {
  const now = new Date();
  const year = getYear(now);
  const weekNumber = getISOWeek(now);
  const monthNumber = getMonth(now) + 1;
  
  // Get all users sorted by points
  const users = await db.userProfile.findMany({
    orderBy: { points: 'desc' }
  });
  
  // Update weekly leaderboard
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
  
  // Update monthly leaderboard
  for (let i = 0; i < users.length; i++) {
    await db.leaderboardEntry.upsert({
      where: {
        userId_period_weekNumber_monthNumber_year: {
          userId: users[i].userId,
          period: 'monthly',
          weekNumber: null,
          monthNumber,
          year
        }
      },
      update: {
        points: users[i].points,
        rank: i + 1
      },
      create: {
        userId: users[i].userId,
        period: 'monthly',
        weekNumber: null,
        monthNumber,
        year,
        points: users[i].points,
        rank: i + 1
      }
    });
  }
  
  return {
    weeklyUpdated: users.length,
    monthlyUpdated: users.length,
    timestamp: format(now, 'yyyy-MM-dd HH:mm:ss')
  };
}

/**
 * Get leaderboard by period
 * @param period "weekly", "monthly", or "all-time"
 * @param limit Number of entries to return
 */
export async function getLeaderboardByPeriod(period: string, limit: number = 10) {
  const now = new Date();
  const year = getYear(now);
  const weekNumber = period === 'weekly' ? getISOWeek(now) : undefined;
  const monthNumber = period === 'monthly' ? getMonth(now) + 1 : undefined;
  
  if (period === 'all-time') {
    const profiles = await db.userProfile.findMany({
      take: limit,
      orderBy: { points: 'desc' },
      include: {
        earnedBadges: {
          include: { badge: true }
        }
      }
    });

    // For users with no username, try to sync with Clerk (up to 5 users to avoid rate limits)
    const syncPromises = [];
    let syncCount = 0;
    
    for (const profile of profiles) {
      if (!profile.username && syncCount < 5) {
        syncPromises.push(syncUserProfile(profile.userId));
        syncCount++;
      }
    }
    
    if (syncPromises.length > 0) {
      await Promise.all(syncPromises);
      
      // Fetch the updated profiles
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
    
    return profiles;
  } 
  
  const entries = await db.leaderboardEntry.findMany({
    where: {
      period,
      year,
      ...(weekNumber ? { weekNumber } : {}),
      ...(monthNumber ? { monthNumber } : {})
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
  
  // For time-based leaderboards, sync users with missing usernames
  const syncPromises = [];
  let syncCount = 0;
  
  for (const entry of entries) {
    if (!entry.user.username && syncCount < 5) {
      syncPromises.push(syncUserProfile(entry.userId));
      syncCount++;
    }
  }
  
  if (syncPromises.length > 0) {
    await Promise.all(syncPromises);
    
    // Re-fetch the entries with updated user data
    const updatedEntries = await db.leaderboardEntry.findMany({
      where: {
        period,
        year,
        ...(weekNumber ? { weekNumber } : {}),
        ...(monthNumber ? { monthNumber } : {})
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
    
    return updatedEntries.map(entry => ({
      userId: entry.userId,
      points: entry.points,
      rank: entry.rank,
      username: entry.user.username,
      imageUrl: entry.user.imageUrl,
      earnedBadges: entry.user.earnedBadges
    }));
  }
  
  // Format data to match all-time leaderboard structure
  return entries.map(entry => ({
    userId: entry.userId,
    points: entry.points,
    rank: entry.rank,
    username: entry.user.username,
    imageUrl: entry.user.imageUrl,
    earnedBadges: entry.user.earnedBadges
  }));
}

/**
 * Calculate level based on points
 */
export function calculateLevel(points: number): number {
  // Simple level calculation: level = 1 + Math.floor(points / 100)
  // Level 1: 0-99 points
  // Level 2: 100-199 points
  // etc.
  return 1 + Math.floor(points / 100);
}

/**
 * Get points needed for next level
 */
export function getPointsForNextLevel(points: number): number {
  const currentLevel = calculateLevel(points);
  return currentLevel * 100;
}

/**
 * Set featured badges for a user
 */
export async function setFeaturedBadges(userId: string, badgeIds: string[]): Promise<UserProfile> {
  try {
    // Verify the user has these badges
    const userBadges = await db.userBadge.findMany({
      where: {
        userId,
        badgeId: {
          in: badgeIds,
        },
      },
    });

    if (userBadges.length !== badgeIds.length) {
      throw new Error("User does not have all the specified badges");
    }

    // Update featured badges
    return await db.userProfile.update({
      where: { userId },
      data: {
        featuredBadges: badgeIds,
      },
    });
  } catch (error) {
    console.error("Error setting featured badges:", error);
    throw error;
  }
}

/**
 * Get leaderboard entries for a specific time period
 */
export async function getLeaderboard(
  timeFrame: "daily" | "weekly" | "monthly" | "allTime",
  limit: number = 10
): Promise<any[]> {
  try {
    let date = new Date();
    
    // Calculate date range based on time frame
    if (timeFrame === "daily") {
      date.setHours(0, 0, 0, 0); // Start of today
    } else if (timeFrame === "weekly") {
      const day = date.getDay();
      date.setDate(date.getDate() - day); // Start of the week (Sunday)
      date.setHours(0, 0, 0, 0);
    } else if (timeFrame === "monthly") {
      date.setDate(1); // Start of the month
      date.setHours(0, 0, 0, 0);
    }

    let leaderboard;
    
    if (timeFrame === "allTime") {
      // For all-time, fetch directly from UserProfile
      leaderboard = await db.userProfile.findMany({
        orderBy: {
          points: "desc",
        },
        take: limit,
      });
    } else {
      // For time-based leaderboards, fetch from LeaderboardEntry
      leaderboard = await db.leaderboardEntry.findMany({
        where: {
          timeFrame,
          timestamp: {
            gte: date,
          },
        },
        orderBy: {
          points: "desc",
        },
        take: limit,
        include: {
          userProfile: true,
        },
      });
      
      // Transform the data to match the expected format
      leaderboard = leaderboard.map(entry => ({
        userId: entry.userId,
        username: entry.userProfile.username,
        imageUrl: entry.userProfile.imageUrl,
        points: entry.points,
      }));
    }
    
    return leaderboard;
  } catch (error) {
    console.error(`Error fetching ${timeFrame} leaderboard:`, error);
    return [];
  }
}

/**
 * Create or update time-based leaderboard entries for all users
 */
export async function updateTimeBasedLeaderboardsV2(): Promise<void> {
  try {
    // Get all user profiles
    const profiles = await db.userProfile.findMany();
    
    // Calculate time periods
    const now = new Date();
    
    // Daily (today)
    const daily = new Date(now);
    daily.setHours(0, 0, 0, 0);
    
    // Weekly (start of current week - Sunday)
    const weekly = new Date(now);
    const day = weekly.getDay();
    weekly.setDate(weekly.getDate() - day);
    weekly.setHours(0, 0, 0, 0);
    
    // Monthly (start of current month)
    const monthly = new Date(now);
    monthly.setDate(1);
    monthly.setHours(0, 0, 0, 0);
    
    // Create batch of operations to perform
    for (const profile of profiles) {
      // For each time frame, check if an entry exists and update or create
      for (const timeFrame of ["daily", "weekly", "monthly"] as const) {
        const date = timeFrame === "daily" ? daily : timeFrame === "weekly" ? weekly : monthly;
        
        // Find existing entry
        const existingEntry = await db.leaderboardEntry.findFirst({
          where: {
            userId: profile.userId,
            timeFrame,
            timestamp: {
              gte: date,
            },
          },
        });
        
        if (existingEntry) {
          // Update existing entry if points have changed
          if (existingEntry.points !== profile.points) {
            await db.leaderboardEntry.update({
              where: { id: existingEntry.id },
              data: { points: profile.points },
            });
          }
        } else {
          // Create new entry
          await db.leaderboardEntry.create({
            data: {
              userId: profile.userId,
              timeFrame,
              points: profile.points,
              timestamp: new Date(),
            },
          });
        }
      }
    }
    
    console.log("Successfully updated all time-based leaderboards");
  } catch (error) {
    console.error("Error updating time-based leaderboards:", error);
    throw error;
  }
}

/**
 * Sync user profile data with auth provider data
 */
export async function syncUserProfileWithData(
  userId: string, 
  userData: { fullName?: string; imageUrl?: string; email?: string }
): Promise<UserProfile> {
  try {
    const { fullName, imageUrl, email } = userData;
    
    // Check if profile exists
    const existingProfile = await db.userProfile.findUnique({
      where: { userId },
    });
    
    if (existingProfile) {
      // Update existing profile
      return await db.userProfile.update({
        where: { userId },
        data: {
          username: fullName || existingProfile.username,
          imageUrl: imageUrl || existingProfile.imageUrl,
          email: email || existingProfile.email,
        },
      });
    } else {
      // Create new profile
      return await db.userProfile.create({
        data: {
          userId,
          username: fullName || "User",
          imageUrl: imageUrl || "",
          email: email || "",
          points: 0,
          currentStreak: 0,
          longestStreak: 0,
        },
      });
    }
  } catch (error) {
    console.error("Error syncing user profile:", error);
    throw error;
  }
}

/**
 * Bulk sync user profiles from auth provider data
 */
export async function bulkSyncUserProfiles(
  users: Array<{ id: string; fullName?: string; imageUrl?: string; email?: string }>
): Promise<number> {
  try {
    let syncedCount = 0;
    
    for (const user of users) {
      await syncUserProfileWithData(user.id, {
        fullName: user.fullName,
        imageUrl: user.imageUrl,
        email: user.email,
      });
      syncedCount++;
    }
    
    return syncedCount;
  } catch (error) {
    console.error("Error performing bulk user profile sync:", error);
    throw error;
  }
} 