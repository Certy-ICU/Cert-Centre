import { QueryClient } from '@tanstack/react-query';

/**
 * Create a query client configured for Suspense mode
 * Use this in components or pages where you want to leverage React Suspense
 */
export const createSuspenseQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      suspense: true,
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Utility function to prefetch data for Suspense-enabled components
 * Call this function server-side to ensure data is available when the component suspends
 */
export const prefetchDataForSuspense = async (
  queryClient: QueryClient,
  queryKey: unknown[],
  queryFn: () => Promise<unknown>
) => {
  try {
    // Load the data into the cache
    await queryClient.fetchQuery({
      queryKey,
      queryFn,
    });
    
    return true;
  } catch (error) {
    console.error('Failed to prefetch data for suspense:', error);
    return false;
  }
}; 