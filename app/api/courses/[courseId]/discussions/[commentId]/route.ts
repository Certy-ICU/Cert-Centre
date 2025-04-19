import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { syncCurrentUser } from "@/lib/user-service";

// PATCH endpoint to update a discussion comment
export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string; commentId: string } }
) {
  try {
    const { userId } = auth();
    const { text } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!text || text.trim() === "") {
      return new NextResponse("Comment text is required", { status: 400 });
    }

    // Find the comment and verify ownership
    const comment = await db.comment.findUnique({
      where: {
        id: params.commentId,
        courseId: params.courseId,
      },
      include: {
        user: true
      }
    });

    if (!comment) {
      return new NextResponse("Comment not found", { status: 404 });
    }

    // Verify user is the owner of the comment
    if (comment.user.id !== userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Sync user data
    await syncCurrentUser();

    const updatedComment = await db.comment.update({
      where: {
        id: params.commentId,
      },
      data: {
        text,
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

    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error("[DISCUSSION_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE endpoint to delete a discussion comment
export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string; commentId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Find the comment
    const comment = await db.comment.findUnique({
      where: {
        id: params.commentId,
        courseId: params.courseId,
      },
      include: {
        user: true
      }
    });

    if (!comment) {
      return new NextResponse("Comment not found", { status: 404 });
    }

    // Check if user is owner or course creator
    const isCourseCreator = await db.course.findFirst({
      where: {
        id: params.courseId,
        userId,
      }
    });

    if (comment.user.id !== userId && !isCourseCreator) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Delete the comment
    await db.comment.delete({
      where: {
        id: params.commentId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DISCUSSION_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 