# Advanced React Query Techniques

This guide details how to implement advanced React Query patterns in the Next.js LMS application to further optimize performance.

## 1. Prefetching Data

Prefetching allows you to load data before it's actually needed, improving perceived performance.

### Installation

Ensure React Query is properly installed:

```bash
pnpm add @tanstack/react-query
```

### Implementation

#### 1.1 Basic Prefetching

```typescript
// components/course-list.tsx
"use client";

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import Link from 'next/link';
import { Course } from '@prisma/client';

// Function to fetch a single course
const fetchCourse = async (courseId: string) => {
  const response = await fetch(`/api/courses/${courseId}`);
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

export const CourseList = ({ courses }: { courses: Course[] }) => {
  const queryClient = useQueryClient();
  
  // Prefetch course data when mouse enters the card
  const prefetchCourse = (courseId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['course', courseId],
      queryFn: () => fetchCourse(courseId),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {courses.map((course) => (
        <Link 
          href={`/courses/${course.id}`} 
          key={course.id}
          onMouseEnter={() => prefetchCourse(course.id)}
        >
          <div className="border rounded-lg p-4 hover:shadow-md transition">
            <h3>{course.title}</h3>
            {/* Other course information */}
          </div>
        </Link>
      ))}
    </div>
  );
};
```

#### 1.2 Route-Based Prefetching

For Next.js applications, you can prefetch data when the user is likely to navigate to a different route:

```typescript
// app/(dashboard)/dashboard-page.tsx
"use client";

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

// API fetch functions
const fetchUserCourses = async () => {
  const response = await fetch('/api/user/courses');
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

export default function DashboardPage() {
  const queryClient = useQueryClient();
  
  // Prefetch common data when the dashboard loads
  useEffect(() => {
    // Prefetch user's courses data which will likely be needed soon
    queryClient.prefetchQuery({
      queryKey: ['user', 'courses'],
      queryFn: fetchUserCourses,
      staleTime: 60 * 1000, // 1 minute
    });
    
    // You can prefetch other data that might be needed soon
  }, [queryClient]);
  
  return (
    <div>
      {/* Dashboard content */}
    </div>
  );
}
```

## 2. Parallel Queries

Parallel queries allow you to fetch multiple data sources simultaneously, reducing loading time.

### Implementation

#### 2.1 Basic Parallel Queries

```typescript
// components/course-detail-page.tsx
"use client";

import { useQuery } from '@tanstack/react-query';

// API fetch functions
const fetchCourse = async (courseId: string) => {
  const response = await fetch(`/api/courses/${courseId}`);
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

const fetchCourseReviews = async (courseId: string) => {
  const response = await fetch(`/api/courses/${courseId}/reviews`);
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

const fetchRecommendedCourses = async (categoryId: string) => {
  const response = await fetch(`/api/courses?categoryId=${categoryId}`);
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

export function CourseDetailPage({ courseId }: { courseId: string }) {
  // Fetch course details
  const courseQuery = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourse(courseId),
  });
  
  // Fetch course reviews in parallel
  const reviewsQuery = useQuery({
    queryKey: ['courseReviews', courseId],
    queryFn: () => fetchCourseReviews(courseId),
    // Only fetch reviews after course data is available
    enabled: !!courseQuery.data,
  });
  
  // Fetch recommended courses based on category
  const recommendedQuery = useQuery({
    queryKey: ['recommendedCourses', courseQuery.data?.categoryId],
    queryFn: () => fetchRecommendedCourses(courseQuery.data?.categoryId),
    // Only fetch recommendations after course data is available
    enabled: !!courseQuery.data?.categoryId,
  });
  
  if (courseQuery.isPending) return <div>Loading course...</div>;
  if (courseQuery.error) return <div>Error loading course: {courseQuery.error.message}</div>;
  
  return (
    <div>
      <h1>{courseQuery.data.title}</h1>
      <div>{courseQuery.data.description}</div>
      
      <h2>Reviews</h2>
      {reviewsQuery.isPending ? (
        <div>Loading reviews...</div>
      ) : reviewsQuery.error ? (
        <div>Error loading reviews: {reviewsQuery.error.message}</div>
      ) : (
        <div>{reviewsQuery.data.map(review => (
          <div key={review.id}>{review.content}</div>
        ))}</div>
      )}
      
      <h2>Recommended Courses</h2>
      {recommendedQuery.isPending ? (
        <div>Loading recommendations...</div>
      ) : recommendedQuery.error ? (
        <div>Error loading recommendations: {recommendedQuery.error.message}</div>
      ) : (
        <div>{recommendedQuery.data.map(course => (
          <div key={course.id}>{course.title}</div>
        ))}</div>
      )}
    </div>
  );
}
```

#### 2.2 Using useQueries for Dynamic Parallel Queries

```typescript
// components/student-dashboard.tsx
"use client";

import { useQueries, useQuery } from '@tanstack/react-query';

// API fetch function for a single course
const fetchEnrolledCourse = async (courseId: string) => {
  const response = await fetch(`/api/courses/${courseId}`);
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

// API fetch function for enrolled courses IDs
const fetchEnrolledCoursesIds = async () => {
  const response = await fetch('/api/user/enrolled');
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

export function StudentDashboard() {
  // First, fetch the IDs of all enrolled courses
  const enrolledCoursesQuery = useQuery({
    queryKey: ['user', 'enrolled'],
    queryFn: fetchEnrolledCoursesIds,
  });
  
  // Then, use useQueries to fetch details for each enrolled course in parallel
  const coursesQueries = useQueries({
    queries: (enrolledCoursesQuery.data?.courseIds || []).map(courseId => ({
      queryKey: ['course', courseId],
      queryFn: () => fetchEnrolledCourse(courseId),
      enabled: !!enrolledCoursesQuery.data,
    })),
  });
  
  const isLoading = enrolledCoursesQuery.isPending || coursesQueries.some(query => query.isPending);
  const isError = enrolledCoursesQuery.isError || coursesQueries.some(query => query.isError);
  
  if (isLoading) return <div>Loading your courses...</div>;
  if (isError) return <div>Error loading your courses</div>;
  
  return (
    <div>
      <h1>Your Enrolled Courses</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coursesQueries.map((query, index) => (
          <div key={query.data?.id || index} className="border rounded p-4">
            <h2>{query.data?.title}</h2>
            <p>{query.data?.description}</p>
            {/* Other course information */}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 3. Infinite Queries

Infinite queries are perfect for paginated content like course lists, comments, or any data that loads more content as the user scrolls.

### Implementation

#### 3.1 Basic Infinite Query

```typescript
// components/comments-list.tsx
"use client";

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';

const fetchComments = async ({ 
  courseId, 
  pageParam = 0 
}: { 
  courseId: string, 
  pageParam?: number 
}) => {
  const response = await fetch(`/api/courses/${courseId}/comments?page=${pageParam}&limit=10`);
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

export function CommentsList({ courseId }: { courseId: string }) {
  const observerTarget = useRef(null);
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['comments', courseId],
    queryFn: ({ pageParam }) => fetchComments({ courseId, pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    initialPageParam: 0,
  });
  
  // Intersection Observer for infinite scrolling
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  
  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: '0px 0px 100px 0px', // Load more when element is 100px from viewport
    });
    
    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);
  
  if (status === 'pending') return <div>Loading comments...</div>;
  if (status === 'error') return <div>Error loading comments</div>;
  
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Comments</h3>
      
      {data.pages.map((page, pageIndex) => (
        <div key={pageIndex} className="space-y-2">
          {page.comments.map((comment: any) => (
            <div key={comment.id} className="border rounded-lg p-3">
              <div className="font-semibold">{comment.author}</div>
              <div>{comment.content}</div>
              <div className="text-sm text-gray-500">{comment.createdAt}</div>
            </div>
          ))}
        </div>
      ))}
      
      {/* Loading indicator and observer target */}
      <div ref={observerTarget} className="h-10 flex items-center justify-center">
        {isFetchingNextPage ? 'Loading more...' : hasNextPage ? 'Scroll for more' : 'No more comments'}
      </div>
    </div>
  );
}
```

#### 3.2 Infinite Query with Search/Filter Support

```typescript
// components/course-search-results.tsx
"use client";

import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import qs from 'query-string';

// API fetch function with search parameters
const fetchCourses = async ({ 
  pageParam = 0,
  searchTerm,
  categoryId
}: { 
  pageParam?: number,
  searchTerm?: string,
  categoryId?: string
}) => {
  const query = qs.stringify({
    page: pageParam,
    limit: 12,
    title: searchTerm,
    categoryId: categoryId
  }, { skipNull: true, skipEmptyString: true });
  
  const response = await fetch(`/api/courses?${query}`);
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

export function CourseSearchResults({ 
  initialSearchTerm = '', 
  initialCategoryId = '' 
}: { 
  initialSearchTerm?: string, 
  initialCategoryId?: string 
}) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const observerTarget = useRef(null);
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['courses', searchTerm, categoryId],
    queryFn: ({ pageParam }) => fetchCourses({ 
      pageParam, 
      searchTerm, 
      categoryId 
    }),
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    initialPageParam: 0,
  });
  
  // Apply filters and reset search
  const applyFilters = () => {
    refetch();
  };
  
  // Infinite scroll logic
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
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search courses..."
          className="px-4 py-2 border rounded-md"
        />
        
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="">All Categories</option>
          {/* Add your category options here */}
        </select>
        
        <button
          onClick={applyFilters}
          className="px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Apply Filters
        </button>
      </div>
      
      {status === 'pending' && <div>Loading courses...</div>}
      {status === 'error' && <div>Error loading courses</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data?.pages.map((page, pageIndex) => (
          <div key={pageIndex} className="contents">
            {page.courses.map((course: any) => (
              <div key={course.id} className="border rounded-lg p-4">
                <h3 className="font-bold">{course.title}</h3>
                <p>{course.description}</p>
                {/* Other course details */}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      <div ref={observerTarget} className="h-20 flex items-center justify-center mt-8">
        {isFetchingNextPage ? (
          <div>Loading more courses...</div>
        ) : hasNextPage ? (
          <div>Scroll for more courses</div>
        ) : (
          <div>No more courses</div>
        )}
      </div>
    </div>
  );
}
```

## 4. Suspense Integration

Integrating React Query with Suspense allows for a more declarative way to handle loading states.

### Implementation

#### 4.1 Basic Suspense Integration

```typescript
// app/(dashboard)/(routes)/courses/[courseId]/page.tsx
"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense } from 'react';

// Components
import { CourseDetails } from './components/course-details';
import { CourseChapters } from './components/course-chapters';
import { CourseReviews } from './components/course-reviews';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      suspense: true, // Enable suspense mode for queries by default
    },
  },
});

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

#### 4.2 Suspense-Ready Components

```typescript
// components/course-details.tsx
"use client";

import { useQuery } from '@tanstack/react-query';

// API fetch function
const fetchCourseDetails = async (courseId: string) => {
  const response = await fetch(`/api/courses/${courseId}`);
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

export function CourseDetails({ courseId }: { courseId: string }) {
  // With suspense: true, this will suspend during loading
  const { data } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourseDetails(courseId),
  });
  
  // No need for loading state handling, Suspense takes care of it
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h1 className="text-3xl font-bold mb-4">{data.title}</h1>
      <div className="flex items-center mb-4">
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {data.category.name}
        </span>
        <span className="ml-4 text-gray-500">
          {data.chapters.length} chapters
        </span>
      </div>
      <p className="text-gray-700">{data.description}</p>
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">What you'll learn</h2>
        <ul className="list-disc pl-5 space-y-1">
          {data.learningObjectives.map((objective: string) => (
            <li key={objective}>{objective}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

## 5. Combining Techniques

For maximum performance, you can combine all these techniques:

```typescript
// components/optimized-course-browser.tsx
"use client";

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';

// Fetch function for courses
const fetchCourses = async ({ pageParam = 0, categoryId = '' }) => {
  const response = await fetch(`/api/courses?page=${pageParam}&categoryId=${categoryId}&limit=9`);
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

// Fetch function for course details (for prefetching)
const fetchCourseDetails = async (courseId: string) => {
  const response = await fetch(`/api/courses/${courseId}`);
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

export function CourseCard({ course }: { course: any }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Prefetch course details on hover
  const prefetchCourseDetails = () => {
    queryClient.prefetchQuery({
      queryKey: ['course', course.id],
      queryFn: () => fetchCourseDetails(course.id),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
  
  return (
    <div 
      className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
      onClick={() => router.push(`/courses/${course.id}`)}
      onMouseEnter={prefetchCourseDetails}
    >
      <h3 className="font-bold text-lg">{course.title}</h3>
      <p className="text-gray-600 mt-2 line-clamp-2">{course.description}</p>
      <div className="mt-4 flex justify-between items-center">
        <span className="text-blue-600">${course.price}</span>
        <span className="bg-gray-100 px-2 py-1 rounded text-sm">
          {course.category.name}
        </span>
      </div>
    </div>
  );
}

export function OptimizedCourseBrowser() {
  const [categoryId, setCategoryId] = useState('');
  const observerTarget = useRef(null);
  const queryClient = useQueryClient();
  
  // Infinite query for courses
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['courses', 'browse', categoryId],
    queryFn: ({ pageParam }) => fetchCourses({ pageParam, categoryId }),
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    initialPageParam: 0,
  });
  
  // Prefetch the next page of results
  useEffect(() => {
    if (data?.pages?.length && hasNextPage) {
      const nextPageParam = data.pages[data.pages.length - 1].nextCursor;
      if (nextPageParam) {
        queryClient.prefetchInfiniteQuery({
          queryKey: ['courses', 'browse', categoryId],
          queryFn: ({ pageParam }) => fetchCourses({ pageParam, categoryId }),
          initialPageParam: nextPageParam,
        });
      }
    }
  }, [data, hasNextPage, categoryId, queryClient]);
  
  // Infinite scroll observer
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
      <div className="mb-6">
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="">All Categories</option>
          {/* Add category options here */}
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data?.pages.map((page, pageIndex) => (
          <div key={pageIndex} className="contents">
            {page.courses.map((course: any) => (
              <Suspense key={course.id} fallback={<div className="border rounded-lg p-4">Loading...</div>}>
                <CourseCard course={course} />
              </Suspense>
            ))}
          </div>
        ))}
      </div>
      
      <div ref={observerTarget} className="h-20 flex items-center justify-center mt-8">
        {isFetchingNextPage ? (
          <div>Loading more courses...</div>
        ) : hasNextPage ? (
          <div>Scroll for more courses</div>
        ) : (
          <div>No more courses</div>
        )}
      </div>
    </div>
  );
}
```

## 6. Best Practices

1. **Structured Query Keys**: Use consistent, structured query keys to aid in cache manipulation and invalidation.
2. **Stale Time Configuration**: Set appropriate stale times based on how frequently your data changes.
3. **Error Boundaries**: Use error boundaries to gracefully handle errors in React Query components, especially when using Suspense.
4. **Optimistic Updates**: Implement optimistic updates to make your UI feel more responsive.
5. **Prefetch Strategically**: Don't over-prefetch; focus on data that users are likely to need soon.

## 7. Testing

When implementing these advanced React Query techniques, thoroughly test your application:

1. Verify prefetching works by checking the React Query DevTools for cached queries.
2. Test parallel queries by ensuring all data is loaded correctly and efficiently.
3. Test infinite queries by scrolling through large datasets and verifying data is loaded in chunks.
4. When using Suspense, test with different network conditions to ensure loading states are displayed correctly.

By implementing these advanced React Query techniques, your application will provide a faster, more responsive user experience while reducing network load and improving overall performance. 