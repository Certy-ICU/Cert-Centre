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
  priceRange?: string;
  sortBy?: string;
};

export const getCourses = async ({
  userId,
  title,
  categoryId,
  priceRange,
  sortBy = "recent"
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
    
    // Add price range filter
    if (priceRange && priceRange !== "all") {
      switch (priceRange) {
        case 'free':
          // @ts-ignore - Add to where clause
          where.price = 0;
          break;
        case 'paid':
          // @ts-ignore - Add to where clause
          where.price = { gt: 0 };
          break;
        case 'low':
          // @ts-ignore - Add to where clause
          where.price = { gt: 0, lte: 50 };
          break;
        case 'medium':
          // @ts-ignore - Add to where clause
          where.price = { gt: 50, lte: 100 };
          break;
        case 'high':
          // @ts-ignore - Add to where clause
          where.price = { gt: 100 };
          break;
      }
    }
    
    console.log("[GET_COURSES] Query with filters:", JSON.stringify(where));
    
    // Determine sorting option
    let orderBy = {};
    
    switch (sortBy) {
      case 'recent':
        orderBy = { createdAt: "desc" };
        break;
      case 'oldest':
        orderBy = { createdAt: "asc" };
        break;
      case 'priceAsc':
        orderBy = { price: "asc" };
        break;
      case 'priceDesc':
        orderBy = { price: "desc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }
    
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
      orderBy
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