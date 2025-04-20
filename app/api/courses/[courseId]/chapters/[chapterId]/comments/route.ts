import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { syncCurrentUser } from "@/lib/user-service";
import { awardPoints, checkAndAwardBadge } from "@/lib/gamification-service";
import { pusherServer } from "@/lib/pusher";

// GET endpoint to fetch comments for a chapter
export async function GET(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    const { userId } = auth();
    
    // If user is authenticated, sync their data first
    if (userId) {
      await syncCurrentUser();
    }
    
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get("parentId") || undefined;
    
    const comments = await db.comment.findMany({
      where: {
        chapterId: params.chapterId,
        parentId: parentId as string | undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              }
            }
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("[COMMENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST endpoint to create a new comment
export async function POST(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    const { userId } = auth();
    const { text, parentId } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!text || text.trim() === "") {
      return new NextResponse("Comment text is required", { status: 400 });
    }

    // Verify the chapter exists and belongs to the course
    const chapter = await db.chapter.findUnique({
      where: {
        id: params.chapterId,
        courseId: params.courseId,
      }
    });

    if (!chapter) {
      return new NextResponse("Chapter not found", { status: 404 });
    }
    
    // Sync user data to our DB
    await syncCurrentUser();

    const comment = await db.comment.create({
      data: {
        text,
        chapter: {
          connect: { id: params.chapterId }
        },
        parent: parentId ? {
          connect: { id: parentId }
        } : undefined,
        user: {
          connect: { id: userId }
        },
        course: {
          connect: { id: params.courseId }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          }
        },
      },
    });

    // Award points for creating a comment (but not for replies)
    if (!parentId) {
      await awardPoints(userId, 5, "Posted a comment");
      
      // Check for first comment badge
      const commentCount = await db.comment.count({
        where: {
          userId,
          parentId: null // Only count top-level comments
        }
      });
      
      if (commentCount === 1) {
        await checkAndAwardBadge(userId, "Engaged Learner");
      }
    }

    // Trigger Pusher event for real-time updates
    const channelName = `chapter-${params.chapterId}-comments`;
    const eventName = parentId ? 'comment:reply' : 'comment:new';

    console.log(`Triggering Pusher event: ${eventName} on channel: ${channelName}`);
    try {
      await pusherServer.trigger(channelName, eventName, {
        comment
      });
      console.log('Pusher event triggered successfully');
    } catch (error) {
      console.error('Failed to trigger Pusher event:', error);
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error("[COMMENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 