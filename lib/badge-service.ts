import { db } from "@/lib/db";

/**
 * Award a badge with specific tier to a user
 * @param userId The Clerk user ID
 * @param badgeName The name of the badge
 * @param tier The tier of the badge (bronze, silver, gold)
 */
export async function awardTieredBadge(userId: string, badgeName: string, tier: string = "bronze") {
  if (!userId) return null;

  try {
    // Find the badge for the specific tier
    const badge = await db.badge.findFirst({ 
      where: { 
        name: badgeName,
        tier
      } 
    });
    
    if (!badge) {
      console.warn(`Badge not found: ${badgeName} (${tier})`);
      return null;
    }

    // Check if user already has this badge
    const existingUserBadge = await db.userBadge.findFirst({
      where: { 
        userId,
        badge: {
          name: badgeName,
          tier
        }
      }
    });

    if (!existingUserBadge) {
      return await db.userBadge.create({
        data: { 
          userId, 
          badgeId: badge.id 
        },
        include: { 
          badge: true 
        }
      });
    }
    
    return null;
  } catch (error) {
    console.error("Error awarding tiered badge:", error);
    return null;
  }
}

/**
 * Update badge progress and award appropriate tier
 * @param userId User ID
 * @param badgeName Badge name
 * @param progress Current progress value
 */
export async function updateBadgeProgress(userId: string, badgeName: string, progress: number) {
  // Determine tier based on progress
  let tier = "bronze";
  if (progress >= 25) {
    tier = "gold";
  } else if (progress >= 10) {
    tier = "silver";
  }
  
  return await awardTieredBadge(userId, badgeName, tier);
}

/**
 * Count user's completed courses and award appropriate badge tier
 */
export async function checkAndAwardCourseCompletionBadges(userId: string) {
  try {
    // Count completed courses
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
    
    // Award badges based on completion count
    const results = [];
    
    if (completedCourseCount >= 1) {
      const bronzeBadge = await awardTieredBadge(userId, "Course Completer", "bronze");
      if (bronzeBadge) results.push(bronzeBadge);
    }
    
    if (completedCourseCount >= 5) {
      const silverBadge = await awardTieredBadge(userId, "Course Completer", "silver");
      if (silverBadge) results.push(silverBadge);
    }
    
    if (completedCourseCount >= 10) {
      const goldBadge = await awardTieredBadge(userId, "Course Completer", "gold");
      if (goldBadge) results.push(goldBadge);
    }
    
    return results;
  } catch (error) {
    console.error("Error checking course completion badges:", error);
    return [];
  }
} 