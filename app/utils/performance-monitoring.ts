import { QueryClient } from '@tanstack/react-query';

/**
 * Utility to measure and log the performance of a specific operation
 * Use this to benchmark query execution time
 */
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

/**
 * Measure memory usage, useful for detecting memory leaks
 * Note: Only works in Chrome and some Chromium-based browsers
 */
export const profileMemoryUsage = (label: string) => {
  if (typeof window !== 'undefined' && window.performance && 'memory' in window.performance) {
    // @ts-ignore - TypeScript doesn't recognize memory property
    const memoryInfo = window.performance.memory;
    console.log(`[Memory] ${label}:`, {
      totalJSHeapSize: `${(memoryInfo.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      usedJSHeapSize: `${(memoryInfo.usedJSHeapSize / 1048576).toFixed(2)} MB`, 
      jsHeapSizeLimit: `${(memoryInfo.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
    });
  }
};

/**
 * Run a synthetic load test on React Query
 * Useful for testing how your query setup handles multiple parallel requests
 */
export const runReactQueryLoadTest = async (
  queryClient: QueryClient, 
  options = { queryCount: 50, maxDelay: 300 }
) => {
  console.log('Starting React Query load test...');
  performance.mark('load-test-start');
  
  // Run multiple queries in parallel
  const promises = [];
  for (let i = 1; i <= options.queryCount; i++) {
    promises.push(
      queryClient.prefetchQuery({
        queryKey: ['load-test', `test-${i}`],
        queryFn: async () => {
          // Simulate variable response times
          await new Promise(r => setTimeout(r, Math.random() * options.maxDelay + 100));
          return { id: `test-${i}`, title: `Test Item ${i}` };
        },
      })
    );
  }
  
  await Promise.all(promises);
  
  performance.mark('load-test-end');
  performance.measure('Load Test', 'load-test-start', 'load-test-end');
  
  const measurements = performance.getEntriesByName('Load Test');
  console.log(`Load test completed in ${measurements[0].duration.toFixed(2)}ms`);
  
  // Check memory usage after test
  profileMemoryUsage('After load test');
  
  return {
    duration: measurements[0].duration,
    queriesExecuted: options.queryCount,
    averageQueryTime: measurements[0].duration / options.queryCount,
  };
};

/**
 * Create a simple performance report of all React Query operations
 */
export const generateQueryPerformanceReport = (queryClient: QueryClient) => {
  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();
  
  const report = queries.map(query => {
    const state = query.state;
    return {
      queryKey: JSON.stringify(query.queryKey),
      status: state.status,
      fetchTime: state.dataUpdatedAt ? state.dataUpdatedAt - state.fetchedAt : 0,
      lastUpdated: state.dataUpdatedAt ? new Date(state.dataUpdatedAt).toLocaleString() : 'N/A',
      isFetching: state.isFetching,
      isStale: state.isStale,
      cacheTime: new Date(state.dataUpdatedAt ?? 0).toLocaleString(),
    };
  });
  
  console.table(report);
  
  return report;
}; 