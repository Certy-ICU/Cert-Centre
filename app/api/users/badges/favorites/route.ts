import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const { badgeIds } = await req.json();
    
    // Validate input
    if (!Array.isArray(badgeIds) || badgeIds.length > 5) {
      return new NextResponse("Invalid input: Maximum 5 badges can be featured", { status: 400 });
    }
    
    // Check if all badge IDs exist for this user
    const existingBadges = await db.userBadge.findMany({
      where: {
        userId,
        badgeId: {
          in: badgeIds
        }
      }
    });
    
    if (existingBadges.length !== badgeIds.length) {
      return new NextResponse("Some badges do not belong to the user", { status: 400 });
    }
    
    // Update user's featured badges - store as JSON string
    const profile = await db.userProfile.update({
      where: { userId },
      data: { 
        featuredBadges: JSON.stringify(badgeIds)
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            imageUrl: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: "Featured badges updated successfully",
      data: profile
    });
  } catch (error) {
    console.error("[BADGE_FAVORITES]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 