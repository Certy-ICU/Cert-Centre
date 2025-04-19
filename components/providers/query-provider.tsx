"use client";

import React from 'react';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default stale time: How long data is considered fresh (0 = always stale)
        staleTime: 60 * 1000, // 1 minute
        // Default cache time: How long inactive query data is kept in memory
        // cacheTime: 5 * 60 * 1000, // 5 minutes (default)
        // refetchOnWindowFocus: false, // Optional: disable refetch on window focus
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // NOTE: Avoid useState when initializing the query client if you are
  //       supporting SSR, otherwise the query client will be different on
  //       the client and server.
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
} 