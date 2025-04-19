import { safeDb, isServer, serverOnly } from "@/lib/safe-db";
import { isSameDay, differenceInDays } from "date-fns";
import { awardTieredBadge } from "./badge-service";
import { awardPoints } from "./gamification-service";

/**
 * Update a user's login streak
 * @param userId The Clerk user ID
 */
export const updateUserStreak = serverOnly(async (userId: string) => {
  if (!userId) return null;

  try {
    // Get current user profile
    const profile = await safeDb.userProfile.findUnique({
      where: { userId }
    });
    
    if (!profile) {
      // Create profile if it doesn't exist
      return await safeDb.userProfile.create({
        data: {
          userId,
          points: 0,
          currentStreak: 1,
          longestStreak: 1,
          lastLoginDate: new Date()
        }
      });
    }
    
    const now = new Date();
    const lastLogin = profile.lastLoginDate;
    
    // Initialize data for update
    const streakData: { 
      lastLoginDate: Date;
      currentStreak?: number;
      longestStreak?: number;
    } = {
      lastLoginDate: now,
    };
    
    // No previous login - start streak
    if (!lastLogin) {
      streakData.currentStreak = 1;
      streakData.longestStreak = 1;
    } else {
      // Check if last login was yesterday
      const isYesterday = differenceInDays(now, lastLogin) === 1;
      // Check if last login was today
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
    const updatedProfile = await safeDb.userProfile.update({
      where: { userId },
      data: streakData
    });
    
    // Check if streak milestones reached for badges and rewards
    const streak = updatedProfile.currentStreak;
    
    // Daily login point (small reward for consistency)
    await awardPoints(userId, 1, "Daily login");
    
    // Streak milestone rewards
    if (streak === 3) {
      await awardTieredBadge(userId, "Streak", "bronze");
    }
    
    if (streak === 7) {
      await awardTieredBadge(userId, "Streak", "silver");
      await awardPoints(userId, 25, "7-day login streak");
    }
    
    if (streak === 30) {
      await awardTieredBadge(userId, "Streak", "gold");
      await awardPoints(userId, 100, "30-day login streak");
    }
    
    return updatedProfile;
  } catch (error) {
    console.error("Error updating user streak:", error);
    return null;
  }
}); 