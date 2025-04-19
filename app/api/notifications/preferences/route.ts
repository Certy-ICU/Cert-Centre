import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { db } from '@/lib/db';

/**
 * @route POST /api/notifications/preferences
 * @description Create notification preferences for a user
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    
    // Create notification preferences
    const preferences = await db.notificationPreferences.create({
      data: {
        userId,
        courseReminders: body.courseReminders ?? true,
        newContent: body.newContent ?? true,
        achievements: body.achievements ?? true,
        promotions: body.promotions ?? false,
        timeWindows: body.timeWindows ?? { start: '08:00', end: '20:00' },
        quietDays: body.quietDays ?? []
      }
    });
    
    return NextResponse.json({ preferences });
    
  } catch (error) {
    console.error('Error creating notification preferences:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * @route PUT /api/notifications/preferences
 * @description Update notification preferences for a user
 */
export async function PUT(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    
    // Create update data from the request body
    const updateData: any = {};
    
    if (body.courseReminders !== undefined) updateData.courseReminders = body.courseReminders;
    if (body.newContent !== undefined) updateData.newContent = body.newContent;
    if (body.achievements !== undefined) updateData.achievements = body.achievements;
    if (body.promotions !== undefined) updateData.promotions = body.promotions;
    if (body.timeWindows !== undefined) updateData.timeWindows = body.timeWindows;
    if (body.quietDays !== undefined) updateData.quietDays = body.quietDays;
    
    // Update notification preferences
    const preferences = await db.notificationPreferences.upsert({
      where: {
        userId
      },
      update: updateData,
      create: {
        userId,
        courseReminders: body.courseReminders ?? true,
        newContent: body.newContent ?? true,
        achievements: body.achievements ?? true,
        promotions: body.promotions ?? false,
        timeWindows: body.timeWindows ?? { start: '08:00', end: '20:00' },
        quietDays: body.quietDays ?? []
      }
    });
    
    return NextResponse.json({ preferences });
    
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 