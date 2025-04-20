"use client";

import { PropsWithChildren, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

/**
 * React Query Provider that creates a new QueryClient on mount
 * and provides it to all child components
 */
export function ReactQueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    </QueryClientProvider>
  );
}

/**
 * Create this file to enable React Query Devtools in development
 * but disable them in production to reduce bundle size
 */
export function ReactQueryDevtoolsProduction() {
  const [showDevtools, setShowDevtools] = useState(false);

  useEffect(() => {
    // @ts-ignore
    window.toggleDevtools = () => setShowDevtools(prev => !prev);
  }, []);

  return (
    <>
      {showDevtools && (
        <div>
          <ReactQueryDevtools />
        </div>
      )}
    </>
  );
} 