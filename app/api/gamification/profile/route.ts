import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Get user profile
    const profile = await db.userProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        points: true,
        currentStreak: true,
        longestStreak: true,
        lastLoginDate: true,
        featuredBadges: true
      }
    });
    
    if (!profile) {
      return new NextResponse("User profile not found", { status: 404 });
    }
    
    // Get user's badges
    const userBadges = await db.userBadge.findMany({
      where: { userId },
      include: {
        badge: true
      },
      orderBy: {
        earnedAt: 'desc'
      }
    });
    
    // Parse featured badges from JSON string
    let featuredBadgeIds: string[] = [];
    if (profile.featuredBadges) {
      try {
        featuredBadgeIds = JSON.parse(profile.featuredBadges);
      } catch (e) {
        console.error("Error parsing featured badges:", e);
      }
    }
    
    // Get featured badges based on parsed IDs
    const featuredBadges = userBadges.filter(
      userBadge => featuredBadgeIds.includes(userBadge.badgeId)
    );
    
    // Get leaderboard position
    const leaderboardPosition = await db.userProfile.count({
      where: {
        points: {
          gt: profile.points
        }
      }
    });
    
    return NextResponse.json({
      profile: {
        ...profile,
        featuredBadgeIds, // Add parsed array for client convenience
        leaderboardPosition: leaderboardPosition + 1 // +1 because position is 0-indexed
      },
      earnedBadges: userBadges,
      featuredBadges: featuredBadges,
      totalBadges: userBadges.length
    });
  } catch (error) {
    console.error("[GAMIFICATION_PROFILE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 