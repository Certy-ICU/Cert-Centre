import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";

// GET /api/gamification/badges/with-status - Get all badges with earned status
export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Get all badges
    const allBadges = await db.badge.findMany({
      orderBy: {
        tier: "asc" // Order by tier (BRONZE, SILVER, GOLD)
      }
    });
    
    // Get user's earned badges
    const userBadges = await db.userBadge.findMany({
      where: { userId },
      select: { badgeId: true, earnedAt: true }
    });
    
    // Create a map of earned badge IDs for quick lookup
    const earnedBadgeMap = userBadges.reduce((map, userBadge) => {
      map[userBadge.badgeId] = userBadge.earnedAt;
      return map;
    }, {} as { [key: string]: Date });
    
    // Mark each badge with earned status
    const badgesWithStatus = allBadges.map(badge => ({
      ...badge,
      earned: !!earnedBadgeMap[badge.id],
      earnedDate: earnedBadgeMap[badge.id] || null
    }));
    
    return NextResponse.json(badgesWithStatus);
  } catch (error) {
    console.error("[BADGES_WITH_STATUS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 