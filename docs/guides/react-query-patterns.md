# React Query Advanced Patterns Guide

This guide explains how to use the advanced React Query patterns implemented in our application.

## Setup and Installation

First, ensure you have the necessary dependencies:

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

## Provider Setup

Wrap your application with the React Query provider:

```tsx
// app/layout.tsx
import { ReactQueryProvider } from './providers/ReactQueryProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
```

## 1. Prefetching Data

Prefetching helps improve perceived performance by loading data before it's needed.

### Key Utilities:

- `prefetchCourse`: Prefetch a course's data
- `prefetchUserCourses`: Prefetch courses for a user
- `prefetchDashboardData`: Prefetch all common dashboard data

### Example Usage:

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { prefetchCourse } from '@/app/lib/react-query/prefetching';

// In your component
const queryClient = useQueryClient();

// When user hovers over a course card
const handleMouseEnter = () => {
  prefetchCourse(queryClient, course.id);
};

return (
  <div onMouseEnter={handleMouseEnter}>
    {/* Course information */}
  </div>
);
```

## 2. Parallel Queries

Fetch multiple data sources simultaneously for faster loading.

### Key Utilities:

- `useCourseWithRelatedData`: Fetch course and related data in parallel
- `useEnrolledCourses`: Fetch multiple enrolled courses in parallel

### Example Usage:

```tsx
import { useCourseWithRelatedData } from '@/app/lib/react-query/parallel-queries';

function CourseDetailPage({ courseId }: { courseId: string }) {
  const {
    course,
    reviews,
    instructor,
    recommended,
    isLoading,
    isError,
  } = useCourseWithRelatedData(courseId);
  
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading course data</div>;
  
  return (
    <div>
      <h1>{course.data.title}</h1>
      {/* Display reviews, instructor, recommended courses */}
    </div>
  );
}
```

## 3. Infinite Queries

Use infinite queries for paginated data like course lists, comments, etc.

### Key Utilities:

- `useInfiniteCourses`: Load courses with pagination
- `useInfiniteCourseComments`: Load comments with infinite scrolling
- `useInfiniteUserActivity`: Load user activity with infinite scrolling

### Example Usage:

```tsx
import { useInfiniteCourseComments } from '@/app/lib/react-query/infinite-queries';
import { useRef, useEffect } from 'react';

function CommentsList({ courseId }: { courseId: string }) {
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteCourseComments(courseId);
  
  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '0px 0px 200px 0px' }
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  
  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.comments.map(comment => (
            <div key={comment.id}>{comment.content}</div>
          ))}
        </div>
      ))}
      
      <div ref={observerTarget}>
        {isFetchingNextPage ? 'Loading more...' : hasNextPage ? 'Scroll for more' : 'No more comments'}
      </div>
    </div>
  );
}
```

## 4. Suspense Integration

Use React Suspense for declarative loading states.

### Key Utilities:

- `createSuspenseQueryClient`: Create a query client with suspense enabled
- `prefetchDataForSuspense`: Prefetch data for suspense-enabled components

### Example Usage:

```tsx
// app/(dashboard)/(routes)/courses/[courseId]/page.tsx
"use client";

import { Suspense } from 'react';
import { createSuspenseQueryClient } from '@/app/lib/react-query/suspense';
import { QueryClientProvider } from '@tanstack/react-query';

// Components
import { CourseDetails } from './components/course-details';
import { CourseChapters } from './components/course-chapters';
import { CourseReviews } from './components/course-reviews';

// Create a suspense-enabled client
const queryClient = createSuspenseQueryClient();

export default function CoursePage({ params }: { params: { courseId: string } }) {
  const { courseId } = params;
  
  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-6">
        <Suspense fallback={<div>Loading course details...</div>}>
          <CourseDetails courseId={courseId} />
        </Suspense>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Suspense fallback={<div>Loading chapters...</div>}>
              <CourseChapters courseId={courseId} />
            </Suspense>
          </div>
          
          <div>
            <Suspense fallback={<div>Loading reviews...</div>}>
              <CourseReviews courseId={courseId} />
            </Suspense>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}
```

## 5. Combining Techniques

For optimal performance, combine these techniques as shown in the `CourseExplorer` component:

- Uses infinite queries for course listing
- Implements prefetching for course details
- Uses suspense for smooth loading states
- Implements infinite scrolling with IntersectionObserver

## Best Practices

1. **Use Structured Query Keys**: Follow a consistent pattern for query keys:
   - `['course', courseId]`
   - `['user', userId, 'courses']`
   - `['courses', 'infinite', filters]`

2. **Appropriate Stale Times**: Configure stale times based on data volatility:
   - User profile: 10 minutes
   - Course details: 5 minutes
   - Comments/reviews: 1 minute
   - Notifications: 30 seconds

3. **Error Handling**: Always handle error states gracefully:
   ```tsx
   if (query.isPending) return <Loading />;
   if (query.isError) return <ErrorDisplay error={query.error} />;
   ```

4. **DevTools in Development**: Use React Query DevTools for debugging:
   ```tsx
   <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
   ```

5. **Prefetch Strategically**: Only prefetch data that's likely to be needed soon to avoid wasting bandwidth and resources.

For a complete example of these patterns in action, see the `CourseExplorer` component in `app/components/CourseExplorer.tsx`. 