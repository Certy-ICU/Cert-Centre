import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { pusherServer } from "@/lib/pusher";

// Store active users temporarily (in production, Redis would be better)
const activeUsers = new Map<string, { userId: string, user: any, lastSeen: number }>();

// Cleanup inactive users every 60 seconds
setInterval(() => {
  const now = Date.now();
  console.log(`Cleaning up inactive users. Before: ${activeUsers.size} users`);
  for (const [key, value] of activeUsers.entries()) {
    // Remove users inactive for more than 60 seconds
    if (now - value.lastSeen > 60000) {
      console.log(`Removing inactive user: ${value.userId} (${value.user?.name || 'Anonymous'})`);
      activeUsers.delete(key);
    }
  }
  console.log(`After cleanup: ${activeUsers.size} users`);
  
  // Debug: list all active users
  if (activeUsers.size > 0) {
    console.log('Current active users:');
    for (const [key, value] of activeUsers.entries()) {
      console.log(`- ${key}: ${value.userId} (${value.user?.name || 'Anonymous'}) - last seen ${new Date(value.lastSeen).toISOString()}`);
    }
  }
}, 60000);

export async function POST(
  req: Request,
  { params }: { params: { chapterId: string } }
) {
  console.log(`POST presence for chapter: ${params.chapterId}`);
  try {
    const { userId } = auth();
    if (!userId) {
      console.log('Presence POST: Unauthorized - no userId');
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    console.log('Request body received:', body);
    
    if (!body.user) {
      console.log('Presence POST: Missing user data in request body');
      return new NextResponse("Missing user data", { status: 400 });
    }
    
    const { user } = body;
    console.log(`Presence POST: User ${userId} (${user.name || 'Anonymous'}) active in chapter ${params.chapterId}`);
    
    // Verify user ID matches authenticated user
    if (user.id !== userId) {
      console.log('Presence POST: User ID mismatch', user.id, userId);
      return new NextResponse("User ID mismatch", { status: 403 });
    }
    
    // Generate a unique key for this user in this chapter
    const key = `${params.chapterId}:${userId}`;
    
    // Update user presence
    activeUsers.set(key, { 
      userId,
      user,
      lastSeen: Date.now() 
    });
    console.log(`Current active users count: ${activeUsers.size}`);

    // Trigger event to all channel subscribers
    const channelName = `presence-chapter-${params.chapterId}`;
    console.log(`Triggering 'user:active' event on channel: ${channelName}`);
    console.log('Event data:', { user });
    
    try {
      await pusherServer.trigger(channelName, 'user:active', {
        user
      });
      console.log('Pusher event triggered successfully');
    } catch (error) {
      console.error('Failed to trigger Pusher event:', error);
      return new NextResponse(`Failed to trigger Pusher event: ${error}`, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      activeUsers: activeUsers.size
    });
  } catch (error) {
    console.error("[PRESENCE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { chapterId: string } }
) {
  console.log(`DELETE presence for chapter: ${params.chapterId}`);
  try {
    const { userId } = auth();
    if (!userId) {
      console.log('Presence DELETE: Unauthorized - no userId');
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Generate key and remove the user
    const key = `${params.chapterId}:${userId}`;
    const userData = activeUsers.get(key);
    activeUsers.delete(key);
    
    console.log(`User ${userId} removed from chapter ${params.chapterId}`);
    console.log(`Current active users count: ${activeUsers.size}`);

    // Trigger event to all channel subscribers
    const channelName = `presence-chapter-${params.chapterId}`;
    console.log(`Triggering 'user:inactive' event on channel: ${channelName}`);
    
    try {
      await pusherServer.trigger(channelName, 'user:inactive', {
        userId,
        user: userData?.user
      });
      console.log('Pusher event triggered successfully');
    } catch (error) {
      console.error('Failed to trigger Pusher event:', error);
      return new NextResponse(`Failed to trigger Pusher event: ${error}`, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      activeUsers: activeUsers.size
    });
  } catch (error) {
    console.error("[PRESENCE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}