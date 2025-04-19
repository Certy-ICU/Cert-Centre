# Implementing Enhanced Analytics

This guide details how to enhance the analytics capabilities for teachers within the LMS, focusing on data aggregation and visualization.

The existing analytics seem to be located at `app/(dashboard)/(routes)/teacher/analytics/page.tsx` and potentially use `recharts`.

## 1. Define Key Metrics

Identify the most valuable metrics for teachers:

- **Course Performance**: Total revenue, number of enrollments per course.
- **Student Engagement**: Average progress per course, completion rates, most/least completed chapters.
- **Sales Data**: Revenue trends over time (daily, weekly, monthly).
- **Student Demographics (if available/ethical)**: Geographic location (if collected), enrollment times.

## 2. Enhance Backend Data Aggregation

Create or modify API endpoints (or server-side data fetching logic) to compute and retrieve aggregated analytics data efficiently. Avoid calculating complex stats entirely on the client-side.

- **Location**: This logic can reside in dedicated API routes under `app/api/analytics/` or within the server component loading data for the analytics page.
- **Prisma Queries**: Use Prisma's aggregation features (`_sum`, `_count`, `_avg`, `groupBy`).

**Example Aggregation Logic (Conceptual - place in API route or Server Component):**

```typescript
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";

async function getTeacherAnalytics(userId: string) {
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // 1. Get courses owned by the teacher
  const teacherCourses = await db.course.findMany({
    where: { userId },
    select: { id: true, title: true, price: true },
  });

  const courseIds = teacherCourses.map(course => course.id);

  // 2. Get total revenue and enrollments per course
  const courseAnalytics = await Promise.all(
    teacherCourses.map(async (course) => {
      const purchaseData = await db.purchase.aggregate({
        where: { courseId: course.id },
        _count: {
          id: true, // Count of purchases (enrollments)
        },
      });
      // Note: Assumes price stored on Course is accurate at time of purchase.
      // A more robust approach stores price paid on the Purchase record.
      const totalRevenue = purchaseData._count.id * (course.price || 0);

      // 3. Get average completion rate per course (Example)
      const chapters = await db.chapter.findMany({
        where: { courseId: course.id, isPublished: true },
        select: { id: true },
      });
      const chapterIds = chapters.map(ch => ch.id);
      let totalProgressPercentage = 0;
      let enrolledStudentCount = 0;

      if (chapterIds.length > 0) {
        // Find users who bought this course
        const enrolledUsers = await db.purchase.findMany({
            where: { courseId: course.id },
            select: { userId: true }
        });
        const enrolledUserIds = enrolledUsers.map(p => p.userId);
        enrolledStudentCount = enrolledUserIds.length;

        if(enrolledStudentCount > 0) {
            const progressCounts = await db.userProgress.groupBy({
                by: ['userId'],
                where: {
                    userId: { in: enrolledUserIds },
                    chapterId: { in: chapterIds },
                    isCompleted: true,
                },
                _count: {
                    chapterId: true,
                },
            });

            const totalCompletedChaptersSum = progressCounts.reduce((sum, group) => sum + group._count.chapterId, 0);
            // Average percentage = (Total completed chapters by all users) / (Total chapters * Total users)
            totalProgressPercentage = (totalCompletedChaptersSum / (chapterIds.length * enrolledStudentCount)) * 100;
        }
      }

      return {
        courseTitle: course.title,
        totalRevenue,
        totalEnrollments: purchaseData._count.id,
        averageCompletion: enrolledStudentCount > 0 ? parseFloat(totalProgressPercentage.toFixed(2)) : 0,
      };
    })
  );

  // 4. Aggregate total revenue across all courses
  const totalRevenueAllCourses = courseAnalytics.reduce((sum, course) => sum + course.totalRevenue, 0);
  const totalEnrollmentsAllCourses = courseAnalytics.reduce((sum, course) => sum + course.totalEnrollments, 0);

  // 5. Add more aggregations as needed (e.g., revenue over time)

  return {
    courseAnalytics, // Array of { courseTitle, totalRevenue, totalEnrollments, averageCompletion }
    summary: {
      totalRevenue: totalRevenueAllCourses,
      totalEnrollments: totalEnrollmentsAllCourses,
    },
    // Add time-series data, etc.
  };
}

// --- Usage in Server Component ---
// app/(dashboard)/(routes)/teacher/analytics/page.tsx
// const { userId } = auth();
// const analyticsData = await getTeacherAnalytics(userId);
// Pass analyticsData to client components for rendering
```

## 3. Frontend Visualization

Use a charting library (like the existing `recharts` or others like `Chart.js` with its React wrapper) to display the aggregated data.

- **Location**: Update components within `app/(dashboard)/(routes)/teacher/analytics/`.
- **Components**: Create or modify components like:
    - `DataCard`: Display key summary stats (total revenue, total enrollments).
    - `AnalyticsChart`: A reusable component that takes data and renders different chart types (Bar, Line, Pie) using `recharts`.

**Example using `recharts` (Conceptual):**

```typescript
// components/analytics-chart.tsx (Client Component)
'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';

interface ChartData {
  name: string; // e.g., Course Title or Month
  value: number; // e.g., Revenue or Enrollments
  // Add other values if needed for multi-bar/line charts
}

interface AnalyticsChartProps {
  data: ChartData[];
  chartType?: 'bar' | 'line';
  dataKey?: string; // Key in data objects to plot (defaults to 'value')
}

export const AnalyticsChart = ({ data, chartType = 'bar', dataKey = 'value' }: AnalyticsChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      {chartType === 'bar' ? (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
          <Tooltip />
          <Legend />
          <Bar dataKey={dataKey} fill="#3498db" radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : (
        <LineChart data={data}>
           <CartesianGrid strokeDasharray="3 3" />
           <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
           <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
           <Tooltip />
           <Legend />
           <Line type="monotone" dataKey={dataKey} stroke="#3498db" activeDot={{ r: 8 }} />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
};

// --- Usage in Analytics Page (Client Component part) ---
// <AnalyticsChart data={formattedCourseRevenueData} chartType="bar" dataKey="totalRevenue" />
// <AnalyticsChart data={formattedTimeSeriesData} chartType="line" dataKey="revenue" />
```

- **Data Formatting**: Transform the aggregated data fetched from the backend into the format expected by the charting library.
- **UI Enhancements**: Use Shadcn UI components (`Card`, `Table`, etc.) to present the data clearly alongside the charts.
- **Filters**: Add controls (e.g., date range pickers, course selectors) to filter the analytics data dynamically.

## 4. Database Indexing

Ensure relevant database columns used in `WHERE` clauses and `GROUP BY` operations within your aggregation queries are indexed for performance.

- Review `prisma/schema.prisma`.
- Add `@@index([...])` on fields like `courseId`, `userId`, `chapterId`, `createdAt` on the `Purchase`, `UserProgress` models if not already present.
- Run `npx prisma db push` or `npx prisma migrate dev`.

## 5. Caching Strategies

- **Backend Caching**: If analytics queries are slow or run frequently, consider caching the aggregated results at the API level (e.g., using Redis or in-memory cache with a reasonable TTL).
- **Frontend Caching**: If using React Query, ensure appropriate `staleTime` and `cacheTime` are set for analytics queries.

## 6. Testing

- Test the accuracy of backend aggregation queries with sample data.
- Test the frontend components to ensure charts render correctly with different data sets.
- Verify filter functionality.
- Test performance with a larger volume of simulated data. 