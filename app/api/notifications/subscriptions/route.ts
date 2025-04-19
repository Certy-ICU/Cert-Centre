import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { db } from '@/lib/db';

/**
 * @route POST /api/notifications/subscriptions
 * @description Save a push notification subscription
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
    
    if (!body.subscription || !body.subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }
    
    // Add the subscription to the database
    const subscription = await db.pushSubscription.upsert({
      where: {
        endpoint: body.subscription.endpoint
      },
      update: {
        userId,
        expirationTime: body.subscription.expirationTime,
        keys: body.subscription.keys,
        userAgent: body.userAgent
      },
      create: {
        userId,
        endpoint: body.subscription.endpoint,
        expirationTime: body.subscription.expirationTime,
        keys: body.subscription.keys,
        userAgent: body.userAgent
      }
    });
    
    return NextResponse.json({ success: true, subscription });
    
  } catch (error) {
    console.error('Error saving push subscription:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * @route DELETE /api/notifications/subscriptions
 * @description Delete a push notification subscription
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    
    if (!body.endpoint) {
      return NextResponse.json(
        { error: 'Invalid request, endpoint is required' },
        { status: 400 }
      );
    }
    
    // Delete the subscription from the database
    await db.pushSubscription.deleteMany({
      where: {
        userId,
        endpoint: body.endpoint
      }
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting push subscription:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * @route GET /api/notifications/subscriptions
 * @description Get all push notification subscriptions for the current user
 */
export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get all subscriptions for the user
    const subscriptions = await db.pushSubscription.findMany({
      where: {
        userId
      }
    });
    
    return NextResponse.json({ subscriptions });
    
  } catch (error) {
    console.error('Error getting push subscriptions:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 