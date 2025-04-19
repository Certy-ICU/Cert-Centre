import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { db } from '@/lib/db';

/**
 * @route GET /api/notifications/preferences/[userId]
 * @description Get notification preferences for a specific user
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: currentUserId } = auth();
    
    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Only allow users to access their own preferences
    if (params.userId !== currentUserId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    // Get notification preferences
    const preferences = await db.notificationPreferences.findUnique({
      where: {
        userId: params.userId
      }
    });
    
    if (!preferences) {
      return NextResponse.json(
        { error: 'Notification preferences not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(preferences);
    
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 