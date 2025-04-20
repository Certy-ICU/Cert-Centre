import { useQuery, useQueries } from '@tanstack/react-query';

/**
 * Custom hook for fetching a course with all related data in parallel
 */
export const useCourseWithRelatedData = (courseId: string) => {
  // Fetch main course data
  const courseQuery = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) throw new Error('Failed to fetch course');
      return response.json();
    },
  });

  // Fetch course reviews in parallel
  const reviewsQuery = useQuery({
    queryKey: ['course', courseId, 'reviews'],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${courseId}/reviews`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json();
    },
    enabled: !!courseId,
  });

  // Fetch course instructor in parallel
  const instructorQuery = useQuery({
    queryKey: ['course', courseId, 'instructor'],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${courseId}/instructor`);
      if (!response.ok) throw new Error('Failed to fetch instructor');
      return response.json();
    },
    enabled: !!courseId,
  });

  // Fetch recommended courses based on category in parallel
  // Only runs once courseQuery has data with categoryId
  const recommendedQuery = useQuery({
    queryKey: ['courses', 'recommended', courseQuery.data?.categoryId],
    queryFn: async () => {
      const response = await fetch(`/api/courses/recommended?categoryId=${courseQuery.data?.categoryId}`);
      if (!response.ok) throw new Error('Failed to fetch recommended courses');
      return response.json();
    },
    enabled: !!courseQuery.data?.categoryId,
  });

  return {
    course: courseQuery,
    reviews: reviewsQuery,
    instructor: instructorQuery,
    recommended: recommendedQuery,
    isLoading: courseQuery.isPending || reviewsQuery.isPending || instructorQuery.isPending,
    isError: courseQuery.isError || reviewsQuery.isError || instructorQuery.isError,
  };
};

/**
 * Hook to fetch enrolled courses dynamically in parallel
 */
export const useEnrolledCourses = (userId: string) => {
  // First fetch the IDs of enrolled courses
  const enrolledCoursesQuery = useQuery({
    queryKey: ['user', userId, 'enrolledCourseIds'],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/enrolled`);
      if (!response.ok) throw new Error('Failed to fetch enrolled course IDs');
      return response.json();
    },
  });

  // Then use dynamic parallel queries to fetch each course details
  const coursesQueries = useQueries({
    queries: (enrolledCoursesQuery.data?.courseIds || []).map((courseId: string) => ({
      queryKey: ['course', courseId],
      queryFn: async () => {
        const response = await fetch(`/api/courses/${courseId}`);
        if (!response.ok) throw new Error(`Failed to fetch course ${courseId}`);
        return response.json();
      },
      enabled: !!enrolledCoursesQuery.data,
    })),
  });

  return {
    isLoading: enrolledCoursesQuery.isPending || coursesQueries.some(query => query.isPending),
    isError: enrolledCoursesQuery.isError || coursesQueries.some(query => query.isError),
    enrolledCourseIds: enrolledCoursesQuery.data?.courseIds || [],
    courses: coursesQueries.map(query => query.data).filter(Boolean),
    queries: coursesQueries,
  };
}; 