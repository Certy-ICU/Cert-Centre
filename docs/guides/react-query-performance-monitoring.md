# React Query Performance Monitoring and Optimization Guide

This guide provides strategies for measuring, monitoring, and further optimizing the React Query patterns implemented in our application.

## 1. Measuring Performance Improvements

### Setting Up Performance Metrics

To quantify the benefits of our React Query implementation, establish baselines and measurements:

```tsx
// utils/performance-monitoring.ts
export const measureQueryPerformance = (queryName: string) => {
  const startTime = performance.now();
  
  return {
    end: () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`[Performance] ${queryName}: ${duration.toFixed(2)}ms`);
      return duration;
    }
  };
};
```

Use this utility to measure specific queries:

```tsx
const fetchData = async () => {
  const measure = measureQueryPerformance('fetchCourseDetails');
  
  // Fetch data
  const response = await fetch('/api/courses/123');
  const data = await response.json();
  
  measure.end(); // Logs the time taken
  return data;
};
```

### Key Metrics to Track

1. **Time to First Byte (TTFB)**: How quickly the server responds
2. **First Contentful Paint (FCP)**: When the first content appears
3. **Largest Contentful Paint (LCP)**: When the largest content element appears
4. **Time to Interactive (TTI)**: When the page becomes fully interactive
5. **Total Blocking Time (TBT)**: Sum of all time periods blocking the main thread
6. **Cumulative Layout Shift (CLS)**: Measures visual stability

### A/B Testing Approach

1. Create two versions of a component:
   - One using traditional data fetching
   - One using React Query with optimizations

2. Implement a simple toggle to switch between versions:

```tsx
// components/CourseListExperiment.tsx
import { useState } from 'react';
import { CourseListTraditional } from './CourseListTraditional';
import { CourseListOptimized } from './CourseListOptimized';

export const CourseListExperiment = () => {
  const [useOptimized, setUseOptimized] = useState(true);
  
  return (
    <div>
      <label className="flex items-center space-x-2 mb-4">
        <input 
          type="checkbox" 
          checked={useOptimized}
          onChange={() => setUseOptimized(!useOptimized)}
        />
        <span>Use optimized version</span>
      </label>
      
      {useOptimized ? <CourseListOptimized /> : <CourseListTraditional />}
    </div>
  );
};
```

3. Record metrics for both versions and compare results

## 2. React Query DevTools for Monitoring

React Query DevTools provide real-time insights into query performance and behavior.

### Setting Up DevTools

The DevTools are already set up in our `ReactQueryProvider.tsx` file. To use them effectively:

1. Open your app in development mode
2. Look for the floating React Query logo in the bottom-right corner
3. Click it to open the panel

### What to Monitor in DevTools

1. **Stale Queries**: Identify queries that become stale too quickly or not quickly enough
2. **Cache Hits/Misses**: Verify prefetching is working by checking for cache hits
3. **Refetch Patterns**: Monitor when queries are refetching to optimize patterns
4. **Query Times**: Check how long queries take to execute
5. **Error States**: Identify failing queries that need attention

### Recording DevTools Sessions

For thorough analysis, record DevTools sessions:

```tsx
// Only in development builds
if (process.env.NODE_ENV === 'development') {
  import('@tanstack/react-query-devtools/recordAndReplay').then(({ recordQueryCache }) => {
    recordQueryCache();
  });
}
```

Then export the recording from the DevTools panel for later analysis.

## 3. Lighthouse and Web Vitals

Use Lighthouse and Web Vitals to measure overall application performance.

### Setting Up Web Vitals Reporting

```tsx
// app/layout.tsx
import { ReactQueryProvider } from './providers/ReactQueryProvider';
import { reportWebVitals } from './utils/reportWebVitals';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}

// utils/reportWebVitals.ts
import { ReportHandler } from 'web-vitals';

export const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};
```

### Running Lighthouse Tests

1. Open Chrome DevTools
2. Go to the "Lighthouse" tab
3. Select "Performance" and other relevant categories
4. Run the test in incognito mode for accurate results
5. Look for suggestions related to data fetching and JavaScript performance

## 4. Advanced Optimization Techniques

Beyond the basic React Query patterns, these advanced techniques can further boost performance:

### 1. Selective Hydration with Suspense

Prioritize critical UI elements for hydration:

```tsx
// app/courses/[courseId]/page.tsx
import { Suspense, lazy } from 'react';

// Eagerly load critical components
import { CourseHeader } from './components/CourseHeader';

// Lazily load less critical components
const CourseReviews = lazy(() => import('./components/CourseReviews'));
const RelatedCourses = lazy(() => import('./components/RelatedCourses'));

export default function CoursePage({ params }) {
  return (
    <div>
      {/* Critical content loads first */}
      <CourseHeader courseId={params.courseId} />
      
      {/* Less critical content loads later */}
      <Suspense fallback={<div>Loading reviews...</div>}>
        <CourseReviews courseId={params.courseId} />
      </Suspense>
      
      <Suspense fallback={<div>Loading related courses...</div>}>
        <RelatedCourses courseId={params.courseId} />
      </Suspense>
    </div>
  );
}
```

### 2. Query Key Factories

Create a centralized query key factory for better organization and type safety:

```tsx
// lib/react-query/queryKeys.ts
export const queryKeys = {
  courses: {
    all: ['courses'] as const,
    lists: () => [...queryKeys.courses.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.courses.lists(), { filters }] as const,
    details: () => [...queryKeys.courses.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.courses.details(), id] as const,
  },
  user: {
    all: ['user'] as const,
    details: () => [...queryKeys.user.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.user.details(), id] as const,
    courses: (id: string) => [...queryKeys.user.detail(id), 'courses'] as const,
  },
};
```

Usage:

```tsx
useQuery({
  queryKey: queryKeys.courses.detail(courseId),
  queryFn: () => fetchCourse(courseId),
});
```

### 3. Optimistic Updates

Update UI immediately before the server confirms changes:

```tsx
// hooks/useCourseRating.ts
export const useCourseRating = (courseId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ rating }: { rating: number }) => 
      fetch(`/api/courses/${courseId}/rate`, {
        method: 'POST',
        body: JSON.stringify({ rating }),
      }),
    
    // Optimistically update the UI
    onMutate: async ({ rating }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['course', courseId] });
      
      // Snapshot the previous value
      const previousCourse = queryClient.getQueryData(['course', courseId]);
      
      // Optimistically update the cache
      queryClient.setQueryData(['course', courseId], (old: any) => ({
        ...old,
        rating: {
          ...old.rating,
          userRating: rating,
          averageRating: ((old.rating.averageRating * old.rating.totalRatings) + rating) / (old.rating.totalRatings + 1),
          totalRatings: old.rating.totalRatings + 1,
        }
      }));
      
      return { previousCourse };
    },
    
    // If mutation fails, roll back to the previous value
    onError: (err, variables, context) => {
      if (context?.previousCourse) {
        queryClient.setQueryData(['course', courseId], context.previousCourse);
      }
    },
    
    // Always refetch after error or success to make sure cache is in sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
};
```

### 4. Data Synchronization Across Tabs

Keep data fresh across browser tabs:

```tsx
// providers/ReactQueryProvider.tsx
import { PropsWithChildren, useState } from 'react';
import { QueryClient, QueryClientProvider, broadcastQueryClient } from '@tanstack/react-query';
import { createBrowserHistory } from 'history';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export function ReactQueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          gcTime: 5 * 60 * 1000,
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    });
    
    // Set up cross-tab syncing
    const history = createBrowserHistory();
    const querySync = broadcastQueryClient({
      queryClient: client,
      broadcastChannel: 'app-query-cache',
    });
    
    return client;
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    </QueryClientProvider>
  );
}
```

### 5. Background Data Fetching

Update stale data in the background while showing cached data:

```tsx
// hooks/useCourseData.ts
export const useCourseData = (courseId: string) => {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourse(courseId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Show cached (stale) data immediately
    // while fetching fresh data in background
    placeholderData: (previousData) => previousData, 
  });
};
```

### 6. Memory Profiling for Queries

Monitor memory usage of your React Query implementation:

```tsx
// utils/memoryProfiler.ts
export const profileMemoryUsage = (label: string) => {
  if (typeof window !== 'undefined' && window.performance && 'memory' in window.performance) {
    // @ts-ignore - TS doesn't know about memory property
    const memoryInfo = window.performance.memory;
    console.log(`[Memory] ${label}:`, {
      totalJSHeapSize: `${(memoryInfo.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      usedJSHeapSize: `${(memoryInfo.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      jsHeapSizeLimit: `${(memoryInfo.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
    });
  }
};
```

Use it to monitor memory before and after query operations.

## 5. Bundle Size Optimization

Reduce the impact of React Query on your bundle size:

### Using Dynamic Imports

```tsx
// app/page.tsx
import dynamic from 'next/dynamic';

// Dynamically import components that use React Query
const CourseExplorer = dynamic(() => import('../components/CourseExplorer'), {
  ssr: false, // If you don't need SSR for this component
  loading: () => <p>Loading...</p>,
});

export default function HomePage() {
  return (
    <div>
      <h1>Home Page</h1>
      <CourseExplorer />
    </div>
  );
}
```

### Production-Only DevTools

```tsx
// providers/ReactQueryProvider.tsx
import { PropsWithChildren, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function ReactQueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient({/* config */}));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  );
}
```

## 6. Creating a Performance Dashboard

Build a simple dashboard to visualize React Query performance metrics:

```tsx
// pages/admin/performance.tsx
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function PerformanceDashboard() {
  const queryClient = useQueryClient();
  const [metrics, setMetrics] = useState([]);
  
  useEffect(() => {
    // Get cache data
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    // Transform into metrics
    const queryMetrics = queries.map(query => ({
      queryKey: JSON.stringify(query.queryKey),
      status: query.state.status,
      fetchTime: query.state.dataUpdatedAt - query.state.fetchedAt,
      lastUpdated: new Date(query.state.dataUpdatedAt).toLocaleTimeString(),
      isFetching: query.state.isFetching,
    }));
    
    setMetrics(queryMetrics);
    
    // Update metrics every second
    const interval = setInterval(() => {
      const updatedQueries = cache.getAll();
      setMetrics(updatedQueries.map(query => ({
        queryKey: JSON.stringify(query.queryKey),
        status: query.state.status,
        fetchTime: query.state.dataUpdatedAt - query.state.fetchedAt,
        lastUpdated: new Date(query.state.dataUpdatedAt).toLocaleTimeString(),
        isFetching: query.state.isFetching,
      })));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [queryClient]);
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">React Query Performance Dashboard</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Query Fetch Times (ms)</h2>
        <BarChart width={800} height={300} data={metrics.filter(m => m.fetchTime > 0)}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="queryKey" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="fetchTime" fill="#8884d8" />
        </BarChart>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3">Active Queries</h2>
          <div className="h-64 overflow-auto">
            {metrics.filter(m => m.isFetching).map((metric, i) => (
              <div key={i} className="mb-2 p-2 bg-blue-50 rounded">
                <div className="font-medium">{metric.queryKey}</div>
                <div className="text-sm text-gray-600">Status: {metric.status}</div>
              </div>
            ))}
            {metrics.filter(m => m.isFetching).length === 0 && (
              <p className="text-gray-500">No active queries</p>
            )}
          </div>
        </div>
        
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3">Query Cache Overview</h2>
          <div className="space-y-4">
            <div>
              <span className="font-medium">Total Queries: </span>
              {metrics.length}
            </div>
            <div>
              <span className="font-medium">Success: </span>
              {metrics.filter(m => m.status === 'success').length}
            </div>
            <div>
              <span className="font-medium">Error: </span>
              {metrics.filter(m => m.status === 'error').length}
            </div>
            <div>
              <span className="font-medium">Pending: </span>
              {metrics.filter(m => m.status === 'pending').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 7. Synthetic Load Testing

Create a load testing utility to simulate heavy query usage:

```tsx
// utils/loadTest.ts
export const runReactQueryLoadTest = async (queryClient: QueryClient) => {
  console.log('Starting React Query load test...');
  performance.mark('load-test-start');
  
  // Run multiple queries in parallel
  const promises = [];
  for (let i = 1; i <= 50; i++) {
    promises.push(
      queryClient.prefetchQuery({
        queryKey: ['course', `test-${i}`],
        queryFn: async () => {
          // Simulate variable response times
          await new Promise(r => setTimeout(r, Math.random() * 300 + 100));
          return { id: `test-${i}`, title: `Test Course ${i}` };
        },
      })
    );
  }
  
  await Promise.all(promises);
  
  performance.mark('load-test-end');
  performance.measure('Load Test', 'load-test-start', 'load-test-end');
  
  const measurements = performance.getEntriesByName('Load Test');
  console.log(`Load test completed in ${measurements[0].duration.toFixed(2)}ms`);
  
  // Check memory usage
  profileMemoryUsage('After load test');
  
  return {
    duration: measurements[0].duration,
    queriesExecuted: 50,
  };
};
```

Run this test from a debug page to assess how your React Query setup handles high load.

## Conclusion

By implementing these testing, monitoring, and optimization strategies, you can ensure your React Query implementation delivers maximum performance benefits to your application. Regularly review these metrics to identify opportunities for further optimization and fine-tune your query patterns based on real usage data. 