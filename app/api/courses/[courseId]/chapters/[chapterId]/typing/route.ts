import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { pusherServer } from "@/lib/pusher";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  console.log(`POST typing for chapter: ${params.chapterId}`);
  try {
    const { userId } = auth();
    
    if (!userId) {
      console.log('Typing POST: Unauthorized - no userId');
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const body = await req.json();
    console.log('Request body received:', body);
    
    if (!body.user) {
      console.log('Typing POST: Missing user data in request body');
      return new NextResponse("Missing user data", { status: 400 });
    }
    
    const { user } = body;
    console.log(`Typing POST: User ${userId} (${user.name || 'Anonymous'}) typing in chapter ${params.chapterId}`);

    // Use regular channel (no prefix) to match the client implementation
    const channelName = `chapter-${params.chapterId}-typing`;
    console.log(`Using channel name: ${channelName}`);
    
    // Verify user data is complete
    if (!user.id || user.id !== userId) {
      console.log('Typing POST: User ID mismatch or missing', user.id, userId);
      return new NextResponse("User ID mismatch", { status: 403 });
    }
    
    // Broadcast the typing event to all users
    console.log(`Triggering 'user:typing' event on channel: ${channelName}`);
    console.log('Event data:', { user });
    
    try {
      await pusherServer.trigger(channelName, 'user:typing', {
        user
      });
      console.log('Pusher event triggered successfully');
    } catch (error) {
      console.error('Failed to trigger Pusher event:', error);
      return new NextResponse("Failed to trigger Pusher event", { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TYPING_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 