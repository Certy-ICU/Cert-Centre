import { useInfiniteQuery } from '@tanstack/react-query';
import qs from 'query-string';

type CourseFilters = {
  searchTerm?: string;
  categoryId?: string;
  sortBy?: 'price' | 'ratings' | 'newest';
  minPrice?: number;
  maxPrice?: number;
};

/**
 * Custom hook for infinite loading of course search results
 */
export const useInfiniteCourses = (filters: CourseFilters = {}) => {
  return useInfiniteQuery({
    queryKey: ['courses', 'infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const queryParams = qs.stringify({
        page: pageParam,
        limit: 12,
        ...filters,
      }, { skipNull: true, skipEmptyString: true });
      
      const response = await fetch(`/api/courses?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    initialPageParam: 0,
  });
};

/**
 * Custom hook for infinite loading of course comments
 */
export const useInfiniteCourseComments = (courseId: string) => {
  return useInfiniteQuery({
    queryKey: ['course', courseId, 'comments', 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/courses/${courseId}/comments?page=${pageParam}&limit=10`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    initialPageParam: 0,
  });
};

/**
 * Custom hook for infinite loading of user activity
 */
export const useInfiniteUserActivity = (userId: string) => {
  return useInfiniteQuery({
    queryKey: ['user', userId, 'activity', 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/users/${userId}/activity?page=${pageParam}&limit=20`);
      if (!response.ok) throw new Error('Failed to fetch user activity');
      return response.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    initialPageParam: 0,
  });
}; 