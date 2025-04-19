import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { awardPoints, checkAndAwardBadge } from "@/lib/gamification-service";

export async function PUT(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    const { userId } = auth();
    const { isCompleted } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    } 

    const userProgress = await db.userProgress.upsert({
      where: {
        userId_chapterId: {
          userId,
          chapterId: params.chapterId,
        }
      },
      update: {
        isCompleted
      },
      create: {
        userId,
        chapterId: params.chapterId,
        isCompleted,
      }
    });

    // If the chapter is being marked as completed, award points and check for badges
    if (isCompleted) {
      // Award points for completing a chapter
      await awardPoints(userId, 10);

      // Check if all chapters in this course are completed
      const publishedChapters = await db.chapter.findMany({
        where: {
          courseId: params.courseId,
          isPublished: true,
        },
        select: {
          id: true,
        }
      });

      const publishedChapterIds = publishedChapters.map((chapter) => chapter.id);
      
      const completedChapters = await db.userProgress.count({
        where: {
          userId,
          chapterId: {
            in: publishedChapterIds,
          },
          isCompleted: true,
        }
      });

      // If all chapters are completed, award course completion points and badge
      if (completedChapters === publishedChapterIds.length && publishedChapterIds.length > 0) {
        // Award bonus points for completing the entire course
        await awardPoints(userId, 50);
        
        // Award badge for completing course
        await checkAndAwardBadge(userId, "First Course Completed");
      }
    }

    return NextResponse.json(userProgress);
  } catch (error) {
    console.log("[CHAPTER_ID_PROGRESS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}