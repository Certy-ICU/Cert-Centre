import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { db } from '@/lib/db';
import webpush from 'web-push';

// Configure web-push
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@certcentre.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

/**
 * @route POST /api/notifications/send
 * @description Send a push notification to a user
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    
    // Only allow admin or instructors to send notifications
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user has permission to send notifications
    const user = await db.user.findUnique({
      where: {
        id: userId
      },
      select: {
        role: true
      }
    });
    
    if (!user || (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    
    if (!body.userIds || !Array.isArray(body.userIds) || !body.notification) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    // Get all subscriptions for these users
    const subscriptions = await db.pushSubscription.findMany({
      where: {
        userId: {
          in: body.userIds
        }
      }
    });
    
    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No subscription found for these users'
      });
    }
    
    // Send push notification to each subscription
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          // Check notification preferences
          const preferences = await db.notificationPreferences.findUnique({
            where: {
              userId: sub.userId
            }
          });
          
          // Skip if notification type is disabled for this user
          if (preferences) {
            // Handle different notification types
            if (
              (body.notification.type === 'courseReminder' && !preferences.courseReminders) ||
              (body.notification.type === 'newContent' && !preferences.newContent) ||
              (body.notification.type === 'achievement' && !preferences.achievements) ||
              (body.notification.type === 'promotion' && !preferences.promotions)
            ) {
              return {
                success: false,
                reason: 'Notification type disabled by user preferences',
                subscription: sub
              };
            }
            
            // Handle quiet days
            if (preferences.quietDays && preferences.quietDays.length > 0) {
              const today = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });
              if (preferences.quietDays.includes(today)) {
                return {
                  success: false,
                  reason: 'Notification skipped due to quiet day',
                  subscription: sub
                };
              }
            }
            
            // Handle time windows
            if (preferences.timeWindows) {
              const now = new Date();
              const currentHour = now.getHours();
              const currentMinute = now.getMinutes();
              const currentTime = currentHour * 60 + currentMinute;
              
              const startParts = preferences.timeWindows.start.split(':');
              const endParts = preferences.timeWindows.end.split(':');
              
              const startTime = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
              const endTime = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
              
              if (currentTime < startTime || currentTime > endTime) {
                return {
                  success: false,
                  reason: 'Notification skipped due to time window',
                  subscription: sub
                };
              }
            }
          }
          
          // Send push notification
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys
            },
            JSON.stringify(body.notification)
          );
          
          return {
            success: true,
            subscription: sub
          };
        } catch (error: any) {
          // Handle expired or invalid subscriptions
          if (error.statusCode === 404 || error.statusCode === 410) {
            // Remove invalid subscription
            await db.pushSubscription.delete({
              where: {
                id: sub.id
              }
            });
          }
          
          return {
            success: false,
            error: error.message,
            subscription: sub
          };
        }
      })
    );
    
    // Count successful and failed notifications
    const successful = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;
    const failed = results.length - successful;
    
    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: results.length
    });
    
  } catch (error) {
    console.error('Error sending push notification:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 