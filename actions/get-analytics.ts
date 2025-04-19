import { db } from "@/lib/db";
import { Course, Purchase } from "@prisma/client";

type PurchaseWithCourse = Purchase & {
  course: Course;
};

const groupByCourse = (purchases: PurchaseWithCourse[]) => {
  const grouped: { [courseTitle: string]: number } = {};
  
  purchases.forEach((purchase) => {
    const courseTitle = purchase.course.title;
    if (!grouped[courseTitle]) {
      grouped[courseTitle] = 0;
    }
    grouped[courseTitle] += purchase.course.price!;
  });

  return grouped;
};

export const getAnalytics = async (userId: string) => {
  try {
    // Get all courses by the teacher with their purchases
    const courses = await db.course.findMany({
      where: {
        userId: userId,
      },
      include: {
        purchases: {
          include: {
            course: true,
          }
        },
        chapters: {
          where: {
            isPublished: true,
          },
          include: {
            userProgress: true,
          }
        }
      }
    });

    // Basic analytics (existing functionality)
    const purchases = courses.flatMap(course => course.purchases);
    const groupedEarnings = groupByCourse(purchases);
    const data = Object.entries(groupedEarnings).map(([courseTitle, total]) => ({
      name: courseTitle,
      total: total,
    }));
    const totalRevenue = data.reduce((acc, curr) => acc + curr.total, 0);
    const totalSales = purchases.length;

    // Course-specific analytics
    const courseAnalytics = courses.map(course => {
      // Revenue and enrollments per course
      const courseRevenue = course.purchases.reduce((sum, purchase) => 
        sum + (course.price || 0), 0);
      const enrollments = course.purchases.length;
      
      // Calculate average completion per course
      let totalProgressPercentage = 0;
      const totalChapters = course.chapters.length;
      
      if (totalChapters > 0 && enrollments > 0) {
        // Get all user IDs who purchased this course
        const enrolledUserIds = course.purchases.map(purchase => purchase.userId);
        
        // Calculate total completed chapters
        let totalCompletedChapters = 0;
        
        enrolledUserIds.forEach(userId => {
          const userCompletedChapters = course.chapters.filter(chapter => 
            chapter.userProgress.some(progress => 
              progress.userId === userId && progress.isCompleted
            )
          ).length;
          
          totalCompletedChapters += userCompletedChapters;
        });
        
        // Average completion percentage
        totalProgressPercentage = (totalCompletedChapters / (totalChapters * enrollments)) * 100;
      }

      return {
        courseId: course.id,
        courseTitle: course.title,
        totalRevenue: courseRevenue,
        totalEnrollments: enrollments,
        averageCompletion: parseFloat(totalProgressPercentage.toFixed(2)),
      };
    });

    // Time-based analytics (daily/weekly/monthly)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Get purchases from the last month
    const recentPurchases = await db.purchase.findMany({
      where: {
        course: {
          userId: userId
        },
        createdAt: {
          gte: oneMonthAgo
        }
      },
      include: {
        course: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Group by day
    const dailyRevenue: Record<string, number> = {};
    recentPurchases.forEach(purchase => {
      const date = purchase.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = 0;
      }
      dailyRevenue[date] += purchase.course.price || 0;
    });

    // Format for the chart
    const timeSeriesData = Object.entries(dailyRevenue).map(([date, revenue]) => ({
      name: date,
      revenue: revenue,
    }));

    // Most/least completed chapters
    const chapterCompletionStats = await db.chapter.findMany({
      where: {
        course: {
          userId: userId
        },
        isPublished: true,
      },
      include: {
        userProgress: {
          where: {
            isCompleted: true
          }
        },
        course: {
          select: {
            title: true
          }
        }
      }
    });

    const chapterStats = chapterCompletionStats.map(chapter => ({
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      courseTitle: chapter.course.title,
      completionCount: chapter.userProgress.length
    }));

    // Sort for most/least completed
    const sortedChapterStats = [...chapterStats].sort((a, b) => b.completionCount - a.completionCount);
    const mostCompletedChapters = sortedChapterStats.slice(0, 5);
    const leastCompletedChapters = [...sortedChapterStats].reverse().slice(0, 5);

    return {
      data, // Original data format for backward compatibility
      totalRevenue,
      totalSales,
      courseAnalytics,
      timeSeriesData,
      mostCompletedChapters,
      leastCompletedChapters
    };
  } catch (error) {
    console.log("[GET_ANALYTICS]", error);
    return {
      data: [],
      totalRevenue: 0,
      totalSales: 0,
      courseAnalytics: [],
      timeSeriesData: [],
      mostCompletedChapters: [],
      leastCompletedChapters: []
    };
  }
}