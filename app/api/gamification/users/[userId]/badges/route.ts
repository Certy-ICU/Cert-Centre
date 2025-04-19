import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

// GET /api/gamification/users/[userId]/badges - Get user badges
export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: currentUserId } = auth();
    const { userId } = params;
    
    if (!currentUserId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Users can view their own badges, but only admins can view others'
    if (currentUserId !== userId) {
      const adminCheck = await isAdmin(currentUserId);
      if (!adminCheck) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
    
    const userBadges = await db.userBadge.findMany({
      where: {
        userId
      },
      include: {
        badge: true
      },
      orderBy: {
        earnedAt: "desc"
      }
    });
    
    return NextResponse.json(userBadges);
  } catch (error) {
    console.error("[USER_BADGES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST /api/gamification/users/[userId]/badges - Assign badge to user (admin only)
export async function POST(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: currentUserId } = auth();
    const { userId } = params;
    
    if (!currentUserId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const adminCheck = await isAdmin(currentUserId);
    
    if (!adminCheck) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    const body = await req.json();
    const { badgeId } = body;
    
    if (!badgeId) {
      return new NextResponse("Badge ID is required", { status: 400 });
    }
    
    // Check if badge exists
    const badge = await db.badge.findUnique({
      where: {
        id: badgeId
      }
    });
    
    if (!badge) {
      return new NextResponse("Badge not found", { status: 404 });
    }
    
    // Check if user already has this badge
    const existingBadge = await db.userBadge.findFirst({
      where: {
        userId,
        badgeId
      }
    });
    
    if (existingBadge) {
      return new NextResponse("User already has this badge", { status: 400 });
    }
    
    // Assign badge to user
    const userBadge = await db.userBadge.create({
      data: {
        userId,
        badgeId,
        earnedAt: new Date()
      },
      include: {
        badge: true
      }
    });
    
    // If this is the user's first badge, also make it featured
    const badgeCount = await db.userBadge.count({
      where: {
        userId
      }
    });
    
    if (badgeCount === 1) {
      await db.userProfile.update({
        where: {
          userId
        },
        data: {
          featuredBadgeIds: [badgeId]
        }
      });
    }
    
    return NextResponse.json(userBadge);
  } catch (error) {
    console.error("[USER_BADGES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE /api/gamification/users/[userId]/badges/[badgeId] - Remove badge from user (admin only)
export async function DELETE(
  req: Request,
  { params }: { params: { userId: string, badgeId: string } }
) {
  try {
    const { userId: currentUserId } = auth();
    const { userId, badgeId } = params;
    
    if (!currentUserId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const adminCheck = await isAdmin(currentUserId);
    
    if (!adminCheck) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    // Check if user has this badge
    const userBadge = await db.userBadge.findFirst({
      where: {
        userId,
        badgeId
      }
    });
    
    if (!userBadge) {
      return new NextResponse("User does not have this badge", { status: 404 });
    }
    
    // Remove badge from user
    await db.userBadge.delete({
      where: {
        id: userBadge.id
      }
    });
    
    // If badge was featured, remove it from featured badges
    const userProfile = await db.userProfile.findUnique({
      where: {
        userId
      }
    });
    
    if (userProfile && userProfile.featuredBadgeIds.includes(badgeId)) {
      await db.userProfile.update({
        where: {
          userId
        },
        data: {
          featuredBadgeIds: userProfile.featuredBadgeIds.filter(id => id !== badgeId)
        }
      });
    }
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[USER_BADGES_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 