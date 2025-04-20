import { Category, Course } from "@prisma/client";

import { getProgress } from "@/actions/get-progress";
import { db } from "@/lib/db";

type CourseWithProgressWithCategory = Course & {
  category: Category | null;
  chapters: { id: string }[];
  progress: number | null;
};

type GetCourses = {
  userId: string;
  title?: string;
  categoryId?: string;
};

export const getCourses = async ({
  userId,
  title,
  categoryId
}: GetCourses): Promise<CourseWithProgressWithCategory[]> => {
  try {
    // Create base query
    const where = {
      isPublished: true,
    };
    
    // Add title filter only if title is provided
    if (title) {
      // @ts-ignore - Add to where clause
      where.title = {
        contains: title,
      };
    }
    
    // Add category filter only if categoryId is provided
    if (categoryId && categoryId !== "all") {
      // @ts-ignore - Add to where clause
      where.categoryId = categoryId;
    }
    
    console.log("[GET_COURSES] Query with filters:", JSON.stringify(where));
    
    const courses = await db.course.findMany({
      where,
      include: {
        category: true,
        chapters: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
          }
        },
        purchases: {
          where: {
            userId,
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      }
    });
    
    console.log(`[GET_COURSES] Found ${courses.length} courses`);

    const coursesWithProgress: CourseWithProgressWithCategory[] = await Promise.all(
      courses.map(async course => {
        if (course.purchases.length === 0) {
          return {
            ...course,
            progress: null,
          }
        }

        const progressPercentage = await getProgress(userId, course.id);

        return {
          ...course,
          progress: progressPercentage,
        };
      })
    );

    return coursesWithProgress;
  } catch (error) {
    console.log("[GET_COURSES]", error);
    return [];
  }
}