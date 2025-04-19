import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all published courses
    const courses = await db.course.findMany({
      where: { 
        isPublished: true 
      },
      select: {
        id: true,
        title: true,
        chapters: {
          where: {
            isPublished: true
          },
          select: {
            id: true
          }
        }
      }
    });

    // For each course, check if the user has completed all chapters
    const completedCourses = await Promise.all(
      courses.map(async (course) => {
        // Skip courses with no chapters
        if (course.chapters.length === 0) {
          return null;
        }

        const chapterIds = course.chapters.map(chapter => chapter.id);
        
        // Count completed chapters
        const completedCount = await db.userProgress.count({
          where: {
            userId,
            chapterId: { in: chapterIds },
            isCompleted: true
          }
        });
        
        // If all chapters completed, return course info
        if (completedCount === chapterIds.length) {
          return {
            id: course.id,
            title: course.title
          };
        }
        
        return null;
      })
    );

    // Filter out null values and return the completed courses
    const filteredCompletedCourses = completedCourses.filter(Boolean);
    
    return NextResponse.json(filteredCompletedCourses);
  } catch (error) {
    console.error("[COMPLETED_COURSES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 