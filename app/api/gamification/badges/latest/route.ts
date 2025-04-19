import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Get the most recently earned badge for this user
    const latestBadge = await db.userBadge.findFirst({
      where: { 
        userId 
      },
      orderBy: { 
        earnedAt: 'desc' 
      },
      include: {
        badge: true
      },
      take: 1
    });
    
    if (!latestBadge) {
      return NextResponse.json({ 
        latestBadge: null 
      });
    }
    
    // Format the response to include only the badge data
    return NextResponse.json({
      latestBadge: {
        id: latestBadge.badge.id,
        name: latestBadge.badge.name,
        description: latestBadge.badge.description,
        iconUrl: latestBadge.badge.iconUrl,
        tier: latestBadge.badge.tier,
        earnedAt: latestBadge.earnedAt
      }
    });
  } catch (error) {
    console.error("[LATEST_BADGE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 