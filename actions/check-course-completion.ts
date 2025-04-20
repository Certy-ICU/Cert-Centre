import { db } from "@/lib/db";

export const checkCourseCompletion = async (
  userId: string,
  courseId: string
): Promise<boolean> => {
  // Get all published chapter IDs for the course
  const chapters = await db.chapter.findMany({
    where: { 
      courseId, 
      isPublished: true 
    },
    select: { 
      id: true 
    },
  });
  const chapterIds = chapters.map((ch: { id: string }) => ch.id);

  if (chapterIds.length === 0) {
    return false; // Cannot complete a course with no published chapters
  }

  // Count completed chapters for the user in this course
  const completedCount = await db.userProgress.count({
    where: {
      userId,
      chapterId: { in: chapterIds },
      isCompleted: true,
    },
  });

  // Return true if all chapters are completed
  return completedCount === chapterIds.length;
}; 