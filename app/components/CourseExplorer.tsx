"use client";

import { useEffect, useRef, useState, Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useInfiniteCourses } from '../lib/react-query/infinite-queries';
import { prefetchCourse } from '../lib/react-query/prefetching';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  category: {
    id: string;
    name: string;
  };
  imageUrl: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

// CourseCard component with prefetching
const CourseCard = ({ course }: { course: Course }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Prefetch course details on hover for better UX
  const handleMouseEnter = () => {
    prefetchCourse(queryClient, course.id);
  };
  
  return (
    <div 
      className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
      onClick={() => router.push(`/courses/${course.id}`)}
      onMouseEnter={handleMouseEnter}
    >
      <div className="aspect-video bg-gray-200 rounded-md mb-3 overflow-hidden">
        {course.imageUrl && (
          <img 
            src={course.imageUrl} 
            alt={course.title} 
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <h3 className="font-bold text-lg line-clamp-1">{course.title}</h3>
      <p className="text-gray-600 mt-2 text-sm line-clamp-2">{course.description}</p>
      <div className="mt-4 flex justify-between items-center">
        <span className="text-blue-600 font-semibold">${course.price.toFixed(2)}</span>
        <span className="bg-gray-100 px-2 py-1 rounded text-sm">
          {course.category.name}
        </span>
      </div>
    </div>
  );
};

// Loading placeholder that matches CourseCard dimensions
const CourseCardSkeleton = () => (
  <div className="border rounded-lg p-4 animate-pulse">
    <div className="aspect-video bg-gray-300 rounded-md mb-3" />
    <div className="h-6 bg-gray-300 rounded w-3/4 mb-2" />
    <div className="h-4 bg-gray-300 rounded w-full mb-1" />
    <div className="h-4 bg-gray-300 rounded w-2/3 mb-4" />
    <div className="flex justify-between items-center">
      <div className="h-5 bg-gray-300 rounded w-16" />
      <div className="h-5 bg-gray-300 rounded w-20" />
    </div>
  </div>
);

export default function CourseExplorer({ 
  initialCategories,
  userId,
}: { 
  initialCategories: CategoryOption[],
  userId?: string,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'ratings' | 'newest'>('newest');
  const observerTarget = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  // Use infinite query for course listing with filters
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteCourses({
    searchTerm,
    categoryId,
    sortBy,
  });
  
  // Prefetch the next page of results when the current page is loaded
  useEffect(() => {
    if (data?.pages?.length && hasNextPage) {
      const nextPageParam = data.pages[data.pages.length - 1].nextCursor;
      
      if (nextPageParam) {
        queryClient.prefetchInfiniteQuery({
          queryKey: ['courses', 'infinite', { searchTerm, categoryId, sortBy }],
          queryFn: ({ pageParam = nextPageParam }) => 
            fetch(`/api/courses?page=${pageParam}&limit=12&categoryId=${categoryId}&search=${searchTerm}&sortBy=${sortBy}`)
              .then(res => {
                if (!res.ok) throw new Error('Network response was not ok');
                return res.json();
              }),
          initialPageParam: nextPageParam,
        });
      }
    }
  }, [data, hasNextPage, searchTerm, categoryId, sortBy, queryClient]);
  
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
  
  // If user is logged in, prefetch their enrolled courses
  useEffect(() => {
    if (userId) {
      queryClient.prefetchQuery({
        queryKey: ['user', userId, 'enrolledCourseIds'],
        queryFn: async () => {
          const response = await fetch(`/api/users/${userId}/enrolled`);
          if (!response.ok) throw new Error('Failed to fetch enrolled course IDs');
          return response.json();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    }
  }, [userId, queryClient]);
  
  // Apply filters and reset search
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };
  
  return (
    <div className="space-y-6">
      <form onSubmit={handleFilterSubmit} className="bg-white p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Courses
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or keywords"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="">All Categories</option>
              {initialCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'price' | 'ratings' | 'newest')}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="newest">Newest</option>
              <option value="price">Price</option>
              <option value="ratings">Ratings</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </form>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <CourseCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data?.pages.map((page, pageIndex) => (
              <div key={pageIndex} className="contents">
                {page.courses.map((course: Course) => (
                  <Suspense key={course.id} fallback={<CourseCardSkeleton />}>
                    <CourseCard course={course} />
                  </Suspense>
                ))}
              </div>
            ))}
          </div>
          
          <div ref={observerTarget} className="h-16 flex items-center justify-center">
            {isFetchingNextPage ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-blue-600 animate-spin" />
                <span>Loading more courses...</span>
              </div>
            ) : hasNextPage ? (
              <span className="text-gray-500">Scroll for more courses</span>
            ) : data?.pages[0]?.courses.length ? (
              <span className="text-gray-500">No more courses to load</span>
            ) : (
              <span className="text-gray-500">No courses found matching your criteria</span>
            )}
          </div>
        </>
      )}
    </div>
  );
} 