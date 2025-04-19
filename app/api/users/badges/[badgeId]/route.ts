import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { db } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: { badgeId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const { badgeId } = params;
    const { isFavorite, displayColor } = await req.json();
    
    // Find the user badge
    const userBadge = await db.userBadge.findFirst({
      where: {
        badgeId,
        userId
      }
    });
    
    if (!userBadge) {
      return new NextResponse("Badge not found", { status: 404 });
    }
    
    // Update customization
    const updatedUserBadge = await db.userBadge.update({
      where: { id: userBadge.id },
      data: {
        isFavorite: isFavorite !== undefined ? isFavorite : userBadge.isFavorite,
        displayColor: displayColor !== undefined ? displayColor : userBadge.displayColor
      },
      include: { badge: true }
    });
    
    return NextResponse.json(updatedUserBadge);
  } catch (error) {
    console.error("[BADGE_CUSTOMIZATION]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { badgeId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const { badgeId } = params;
    
    // Find the user badge with badge details
    const userBadge = await db.userBadge.findFirst({
      where: {
        badgeId,
        userId
      },
      include: {
        badge: true
      }
    });
    
    if (!userBadge) {
      return new NextResponse("Badge not found", { status: 404 });
    }
    
    return NextResponse.json(userBadge);
  } catch (error) {
    console.error("[BADGE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 