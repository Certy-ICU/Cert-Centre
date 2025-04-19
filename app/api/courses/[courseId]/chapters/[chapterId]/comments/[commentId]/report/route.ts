import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { syncCurrentUser } from "@/lib/user-service";

// POST endpoint to report a comment
export async function POST(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string; commentId: string } }
) {
  try {
    const { userId } = auth();
    const { reason } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify the comment exists
    const comment = await db.comment.findUnique({
      where: {
        id: params.commentId,
        chapterId: params.chapterId,
        courseId: params.courseId,
      },
    });

    if (!comment) {
      return new NextResponse("Comment not found", { status: 404 });
    }

    // Don't allow users to report their own comments
    if (comment.userId === userId) {
      return new NextResponse("Cannot report your own comment", { status: 400 });
    }

    // Sync user data to our DB
    await syncCurrentUser();

    // Mark comment as reported
    const updatedComment = await db.comment.update({
      where: {
        id: params.commentId,
      },
      data: {
        moderation: {
          isReported: true,
          reportReason: reason || "No reason provided",
          reportedAt: new Date().toISOString(),
          reportedBy: userId
        }
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Comment reported successfully" 
    });
  } catch (error) {
    console.error("[COMMENT_REPORT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 