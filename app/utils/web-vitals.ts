import { ReportHandler } from 'web-vitals';

/**
 * Setup web vitals reporting
 * This utility helps track Core Web Vitals metrics for your application
 * 
 * Usage:
 * Import this in your app root and call with a handler function:
 * reportWebVitals(metric => {
 *   console.log(metric);
 *   // or send to analytics service
 * });
 */
export const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      // Cumulative Layout Shift
      getCLS(onPerfEntry);
      // First Input Delay
      getFID(onPerfEntry);
      // First Contentful Paint
      getFCP(onPerfEntry);
      // Largest Contentful Paint
      getLCP(onPerfEntry);
      // Time to First Byte
      getTTFB(onPerfEntry);
    });
  }
};

/**
 * Print web vitals to console
 * Use this during development to monitor performance metrics
 */
export const logWebVitals = () => {
  reportWebVitals((metric) => {
    console.log(`[Web Vitals] ${metric.name}: ${metric.value}`);
  });
};

/**
 * Send web vitals to an analytics endpoint
 * Configure this to send metrics to your preferred analytics service
 */
export const sendWebVitalsToAnalytics = (analyticsEndpoint: string) => {
  reportWebVitals((metric) => {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value.toString(),
      id: metric.id,
      startTime: metric.startTime,
      label: metric.label,
      rating: getRating(metric.name, metric.value),
      timestamp: Date.now(),
    });

    // Use `navigator.sendBeacon()` if available, falling back to `fetch()`
    if (navigator.sendBeacon) {
      navigator.sendBeacon(analyticsEndpoint, body);
    } else {
      fetch(analyticsEndpoint, {
        body,
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  });
};

/**
 * Get rating (good/needs improvement/poor) based on metric value
 * Based on Core Web Vitals thresholds
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  switch (name) {
    case 'CLS':
      // CLS thresholds: Good < 0.1, Poor >= 0.25
      return value < 0.1 ? 'good' : value >= 0.25 ? 'poor' : 'needs-improvement';
    case 'FID':
      // FID thresholds: Good < 100ms, Poor >= 300ms
      return value < 100 ? 'good' : value >= 300 ? 'poor' : 'needs-improvement';
    case 'LCP':
      // LCP thresholds: Good < 2500ms, Poor >= 4000ms
      return value < 2500 ? 'good' : value >= 4000 ? 'poor' : 'needs-improvement';
    case 'FCP':
      // FCP thresholds: Good < 1800ms, Poor >= 3000ms
      return value < 1800 ? 'good' : value >= 3000 ? 'poor' : 'needs-improvement';
    case 'TTFB':
      // TTFB thresholds: Good < 800ms, Poor >= 1800ms
      return value < 800 ? 'good' : value >= 1800 ? 'poor' : 'needs-improvement';
    default:
      return 'needs-improvement';
  }
}

/**
 * Create a performance timeline for monitoring specific events in your app
 * Use this to measure key user interactions and page transitions
 */
export const createPerformanceTimeline = () => {
  let timeline: { name: string; startTime: number; duration?: number }[] = [];

  const start = (name: string) => {
    const startTime = performance.now();
    timeline.push({ name, startTime });
    return () => end(name, startTime);
  };

  const end = (name: string, startTime?: number) => {
    const endTime = performance.now();
    
    if (startTime) {
      timeline.push({ name: `${name} (completed)`, startTime: endTime, duration: endTime - startTime });
      return endTime - startTime;
    }
    
    // Find the matching start event if startTime wasn't provided
    const startEvent = timeline.findIndex(
      (event) => event.name === name && !event.duration
    );
    
    if (startEvent !== -1) {
      const duration = endTime - timeline[startEvent].startTime;
      timeline[startEvent].duration = duration;
      return duration;
    }
    
    return 0;
  };

  const getTimeline = () => timeline;
  const clearTimeline = () => { timeline = []; };

  return { start, end, getTimeline, clearTimeline };
}; 