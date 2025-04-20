import { QueryClient } from '@tanstack/react-query';

/**
 * Configure and create a global QueryClient
 * Customize default options for optimal performance
 */
export const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
}); 