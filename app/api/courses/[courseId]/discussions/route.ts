import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { syncCurrentUser } from "@/lib/user-service";
import { awardPoints, checkAndAwardBadge } from "@/lib/gamification-service";

// GET endpoint to fetch discussions for a course
export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = auth();
    
    // If user is authenticated, sync their data first
    if (userId) {
      await syncCurrentUser();
    }
    
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get("parentId") || undefined;
    
    const discussions = await db.comment.findMany({
      where: {
        courseId: params.courseId,
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

    return NextResponse.json(discussions);
  } catch (error) {
    console.error("[DISCUSSIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST endpoint to create a new discussion comment
export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
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

    // Verify the course exists
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
      }
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Sync user data to our DB
    await syncCurrentUser();

    const comment = await db.comment.create({
      data: {
        text,
        parentId: parentId || null,
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

    // Award points for creating a discussion (but not for replies)
    if (!parentId) {
      await awardPoints(userId, 5, "Started a discussion");
      
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

    return NextResponse.json(comment);
  } catch (error) {
    console.error("[DISCUSSIONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 