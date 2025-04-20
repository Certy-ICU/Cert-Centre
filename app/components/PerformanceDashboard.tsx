"use client";

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { generateQueryPerformanceReport, runReactQueryLoadTest } from '../utils/performance-monitoring';

/**
 * A dashboard component for monitoring React Query performance
 * This component displays various metrics about query performance
 */
export default function PerformanceDashboard() {
  const queryClient = useQueryClient();
  const [metrics, setMetrics] = useState<any[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  
  // Generate a performance report
  const refreshMetrics = () => {
    const report = generateQueryPerformanceReport(queryClient);
    setMetrics(report);
  };
  
  // Run a load test
  const handleRunLoadTest = async () => {
    setIsRunningTest(true);
    setTestResults(null);
    
    try {
      const results = await runReactQueryLoadTest(queryClient, {
        queryCount: 30,
        maxDelay: 500
      });
      setTestResults(results);
    } catch (error) {
      console.error("Error running load test:", error);
    } finally {
      setIsRunningTest(false);
    }
  };
  
  // Toggle automatic refresh
  const toggleAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    } else {
      const interval = window.setInterval(refreshMetrics, 2000);
      setRefreshInterval(interval);
    }
  };
  
  // Initial metrics and cleanup
  useEffect(() => {
    refreshMetrics();
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [queryClient]);
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">React Query Performance Dashboard</h1>
        
        <div className="flex items-center gap-3">
          <button
            onClick={refreshMetrics}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Refresh Metrics
          </button>
          
          <button
            onClick={toggleAutoRefresh}
            className={`px-4 py-2 ${
              refreshInterval ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            } text-white rounded transition`}
          >
            {refreshInterval ? 'Stop Auto-Refresh' : 'Auto-Refresh'}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <h2 className="font-semibold text-lg mb-4">Query Cache Overview</h2>
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Total Queries:</span>
              <span>{metrics.length}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Active Queries:</span>
              <span>{metrics.filter(m => m.isFetching).length}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Stale Queries:</span>
              <span>{metrics.filter(m => m.isStale).length}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Success:</span>
              <span>{metrics.filter(m => m.status === 'success').length}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium">Error:</span>
              <span>{metrics.filter(m => m.status === 'error').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Pending:</span>
              <span>{metrics.filter(m => m.status === 'pending').length}</span>
            </div>
          </div>
        </div>
        
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <h2 className="font-semibold text-lg mb-4">Load Testing</h2>
          <div className="mb-4">
            <p className="text-gray-600 mb-4">
              Run a synthetic load test to measure how your React Query setup handles concurrent requests.
            </p>
            <button
              onClick={handleRunLoadTest}
              disabled={isRunningTest}
              className="w-full px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition disabled:bg-indigo-300"
            >
              {isRunningTest ? 'Running Test...' : 'Run Load Test'}
            </button>
          </div>
          
          {testResults && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-3">Test Results:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Queries Executed:</span>
                  <span>{testResults.queriesExecuted}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Duration:</span>
                  <span>{testResults.duration.toFixed(2)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Query Time:</span>
                  <span>{testResults.averageQueryTime.toFixed(2)}ms</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="border rounded-lg p-4 bg-white shadow-sm mb-8">
        <h2 className="font-semibold text-lg mb-4">Active Queries</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query Key</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fetch Time (ms)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {metrics.filter(m => m.isFetching || m.status === 'pending').map((metric, index) => (
                <tr key={index} className="bg-blue-50">
                  <td className="px-4 py-2 text-sm">{metric.queryKey}</td>
                  <td className="px-4 py-2 text-sm">{metric.status}</td>
                  <td className="px-4 py-2 text-sm">{metric.fetchTime}</td>
                  <td className="px-4 py-2 text-sm">{metric.lastUpdated}</td>
                  <td className="px-4 py-2 text-sm">{metric.isStale ? 'Yes' : 'No'}</td>
                </tr>
              ))}
              {metrics.filter(m => m.isFetching || m.status === 'pending').length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-sm text-center text-gray-500">
                    No active queries
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="font-semibold text-lg mb-4">All Queries</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query Key</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fetch Time (ms)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {metrics.map((metric, index) => (
                <tr key={index} className={metric.isFetching ? 'bg-blue-50' : ''}>
                  <td className="px-4 py-2 text-sm">{metric.queryKey}</td>
                  <td className="px-4 py-2 text-sm">{metric.status}</td>
                  <td className="px-4 py-2 text-sm">{metric.fetchTime}</td>
                  <td className="px-4 py-2 text-sm">{metric.lastUpdated}</td>
                  <td className="px-4 py-2 text-sm">{metric.isStale ? 'Yes' : 'No'}</td>
                </tr>
              ))}
              {metrics.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-sm text-center text-gray-500">
                    No queries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 