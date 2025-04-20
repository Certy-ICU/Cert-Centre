import { QueryClient } from '@tanstack/react-query';

/**
 * Prefetch a course's data for improved performance
 * Used when we expect a user to navigate to a course page soon
 */
export const prefetchCourse = async (
  queryClient: QueryClient,
  courseId: string,
) => {
  await queryClient.prefetchQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) throw new Error('Failed to fetch course');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Prefetch user's enrolled courses
 * Used on the dashboard when we anticipate the user may view their courses
 */
export const prefetchUserCourses = async (
  queryClient: QueryClient,
  userId: string,
) => {
  await queryClient.prefetchQuery({
    queryKey: ['user', userId, 'courses'],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/courses`);
      if (!response.ok) throw new Error('Failed to fetch user courses');
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Prefetch common dashboard data
 * Call this function when a user first logs in to preload essential data
 */
export const prefetchDashboardData = async (
  queryClient: QueryClient,
  userId: string,
) => {
  // Prefetch user profile
  await queryClient.prefetchQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user profile');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Prefetch enrolled courses
  await prefetchUserCourses(queryClient, userId);
  
  // Prefetch notifications
  await queryClient.prefetchQuery({
    queryKey: ['user', userId, 'notifications'],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/notifications`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds - notifications update frequently
  });
}; 