/**
 * Centralized query key factory
 * 
 * This provides a structured way to create consistent query keys
 * across the application, improving maintainability and type safety.
 */
export const queryKeys = {
  courses: {
    all: ['courses'] as const,
    lists: () => [...queryKeys.courses.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.courses.lists(), { filters }] as const,
    details: () => [...queryKeys.courses.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.courses.details(), id] as const,
    reviews: (id: string) => [...queryKeys.courses.detail(id), 'reviews'] as const,
    comments: (id: string) => [...queryKeys.courses.detail(id), 'comments'] as const,
    instructor: (id: string) => [...queryKeys.courses.detail(id), 'instructor'] as const,
    recommended: (categoryId: string) => [...queryKeys.courses.all, 'recommended', categoryId] as const,
    search: (term: string) => [...queryKeys.courses.all, 'search', term] as const,
  },
  
  user: {
    all: ['user'] as const,
    details: () => [...queryKeys.user.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.user.details(), id] as const,
    courses: (id: string) => [...queryKeys.user.detail(id), 'courses'] as const,
    enrolledCourses: (id: string) => [...queryKeys.user.detail(id), 'enrolledCourses'] as const,
    notifications: (id: string) => [...queryKeys.user.detail(id), 'notifications'] as const,
    activity: (id: string) => [...queryKeys.user.detail(id), 'activity'] as const,
  },
  
  categories: {
    all: ['categories'] as const,
    detail: (id: string) => [...queryKeys.categories.all, id] as const,
    courses: (id: string) => [...queryKeys.categories.detail(id), 'courses'] as const,
  },
  
  chapters: {
    all: ['chapters'] as const,
    detail: (id: string) => [...queryKeys.chapters.all, id] as const,
    content: (id: string) => [...queryKeys.chapters.detail(id), 'content'] as const,
    progress: (id: string, userId: string) => [...queryKeys.chapters.detail(id), 'progress', userId] as const,
  },
  
  comments: {
    all: ['comments'] as const,
    infinite: (entityType: string, entityId: string) => 
      [...queryKeys.comments.all, 'infinite', entityType, entityId] as const,
  },
  
  search: {
    results: (term: string) => ['search', 'results', term] as const,
  },
  
  dashboard: {
    stats: () => ['dashboard', 'stats'] as const,
    charts: (period: string) => ['dashboard', 'charts', period] as const,
  },
  
  // Helper method to create a custom query key
  custom: (parts: readonly unknown[]) => parts as const,
};

/**
 * Type-safe function to extract the type of a query key
 * Use this when you need the exact type of a specific query key
 * 
 * Example:
 * type CourseDetailKey = ExtractQueryKeyType<typeof queryKeys.courses.detail>;
 */
export type ExtractQueryKeyType<T extends (...args: any[]) => readonly unknown[]> = 
  ReturnType<T>;

/**
 * Get a formatted string representation of a query key
 * Useful for debugging and logging
 */
export const stringifyQueryKey = (queryKey: unknown[]): string => {
  try {
    return queryKey.map(part => 
      typeof part === 'string' ? part : 
      typeof part === 'object' ? JSON.stringify(part) : 
      String(part)
    ).join(':');
  } catch (e) {
    return String(queryKey);
  }
}; 