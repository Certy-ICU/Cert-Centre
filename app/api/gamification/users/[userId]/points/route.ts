import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

// GET /api/gamification/users/[userId]/points - Get user points
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
    
    // Users can view their own points, admins can view any user's points
    if (currentUserId !== userId) {
      const adminCheck = await isAdmin(currentUserId);
      if (!adminCheck) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
    
    const userProfile = await db.userProfile.findUnique({
      where: {
        userId
      },
      select: {
        points: true,
        totalPointsEarned: true
      }
    });
    
    if (!userProfile) {
      return new NextResponse("User profile not found", { status: 404 });
    }
    
    // Get point activity history
    const pointHistory = await db.pointActivity.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 50 // Limit to recent 50 activities
    });
    
    return NextResponse.json({
      currentPoints: userProfile.points,
      totalPointsEarned: userProfile.totalPointsEarned,
      pointHistory
    });
  } catch (error) {
    console.error("[USER_POINTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST /api/gamification/users/[userId]/points - Add or subtract points (admin only)
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
    const { points, reason, activityType } = body;
    
    if (!points || typeof points !== "number") {
      return new NextResponse("Valid points value is required", { status: 400 });
    }
    
    if (!reason) {
      return new NextResponse("Reason is required", { status: 400 });
    }
    
    if (!activityType) {
      return new NextResponse("Activity type is required", { status: 400 });
    }
    
    // Get current user profile
    const userProfile = await db.userProfile.findUnique({
      where: {
        userId
      }
    });
    
    if (!userProfile) {
      return new NextResponse("User profile not found", { status: 404 });
    }
    
    // Create a transaction to update points and record activity
    const result = await db.$transaction(async (tx) => {
      // Record point activity
      const activity = await tx.pointActivity.create({
        data: {
          userId,
          points,
          reason,
          activityType,
          createdAt: new Date()
        }
      });
      
      // Update user profile points
      const updatedProfile = await tx.userProfile.update({
        where: {
          userId
        },
        data: {
          points: {
            increment: points
          },
          // Only increment totalPointsEarned if points are positive
          totalPointsEarned: points > 0 ? {
            increment: points
          } : undefined
        }
      });
      
      return { activity, updatedProfile };
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("[USER_POINTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 