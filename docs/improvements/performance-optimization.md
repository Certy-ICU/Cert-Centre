# Implementing Performance Optimization (React Query)

This guide focuses on improving data fetching performance, caching, and state management in the LMS client components using TanStack Query (React Query).

*Note: The project already includes `@tanstack/react-table`, but not `@tanstack/react-query` explicitly in the provided `package.json`. We'll proceed assuming it needs to be added or confirming its presence.*

## 1. Install Dependencies

If not already installed:

```bash
npm install @tanstack/react-query
# Or using yarn
# yarn add @tanstack/react-query
```

Optionally, install React Query DevTools:

```bash
npm install --save-dev @tanstack/react-query-devtools
# Or using yarn
# yarn add --dev @tanstack/react-query-devtools
```

## 2. Set up Query Client Provider

Create a provider component to initialize and provide the `QueryClient` to your application.

```typescript
// components/providers/query-provider.tsx
"use client";

import React from 'react';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

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
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

```

## 3. Apply Query Provider in Layout

Wrap your root layout (`app/layout.tsx`) or a specific layout boundary with the `QueryProvider`.

```typescript
// app/layout.tsx
import './globals.css'
// ... other imports
import QueryProvider from "@/components/providers/query-provider"; // Adjust path
import { ThemeProvider } from "@/components/providers/theme-provider"

// ... (rest of imports and config)

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider /* ...props */ >
            <QueryProvider> {/* Wrap relevant part of the tree */} 
              <ConfettiProvider />
              <ToastProvider />
              {children}
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
```

## 4. Refactor Data Fetching in Client Components

Identify client components that currently fetch data using `useEffect` and `useState` (or other methods) and refactor them to use React Query hooks like `useQuery`.

**Example: Refactoring a component fetching course data**

**Before (Conceptual):**

```typescript
'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

function CourseDetails({ courseId }) {
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/courses/${courseId}`);
        setCourse(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading course!</div>;
  if (!course) return <div>Course not found.</div>;

  return <div>{course.title}</div>;
}
```

**After (Using `useQuery`):**

```typescript
'use client';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Define a fetch function
const fetchCourse = async (courseId: string) => {
  const { data } = await axios.get(`/api/courses/${courseId}`);
  return data; // Assuming API returns the course object
};

function CourseDetails({ courseId }: { courseId: string }) {
  const {
    data: course,
    isLoading,
    isError,
    error, // Contains error object
  } = useQuery({
    queryKey: ['course', courseId], // Unique key for this query
    queryFn: () => fetchCourse(courseId),
    enabled: !!courseId, // Only run query if courseId exists
    // staleTime: 5 * 60 * 1000, // Optional: Override default staleTime
  });

  if (isLoading) return <div>Loading...</div>;
  // isError covers network errors and non-2xx responses if axios throws
  if (isError) return <div>Error loading course: {error?.message || 'Unknown error'}</div>;
  // Check if data exists (could be null/undefined if API returns nothing on success)
  if (!course) return <div>Course not found.</div>;

  return <div>{course.title}</div>;
}
```

## 5. Handling Mutations (`useMutation`)

For actions that modify data (POST, PATCH, DELETE), use the `useMutation` hook. It handles loading/error states and allows invalidating related queries to refetch fresh data.

**Example: Updating course details**

```typescript
'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

// Define mutation function
const updateCourse = async ({ courseId, values }) => {
  const { data } = await axios.patch(`/api/courses/${courseId}`, values);
  return data;
};

function EditCourseForm({ courseId, initialData }) {
  const queryClient = useQueryClient(); // Get query client instance

  const mutation = useMutation({
    mutationFn: updateCourse,
    onSuccess: (updatedCourseData) => {
      toast.success('Course updated!');
      // Option 1: Invalidate query to refetch
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      // Option 2: Manually update cache if response has full data
      // queryClient.setQueryData(['course', courseId], updatedCourseData);
    },
    onError: (error) => {
      toast.error('Failed to update course: ' + error.message);
    },
  });

  const onSubmit = (formData) => {
    mutation.mutate({ courseId, values: formData });
  };

  return (
    <form onSubmit={/* ... handle form submission calling onSubmit ... */}>
      {/* Form fields */} 
      <button type="submit" disabled={mutation.isLoading}>
        {mutation.isLoading ? 'Saving...' : 'Save Changes'}
      </button>
      {mutation.isError && <div>Error: {mutation.error.message}</div>}
    </form>
  );
}
```

## 6. Key Concepts & Benefits

- **Caching**: React Query automatically caches query results, reducing redundant API calls and improving perceived performance.
- **Background Updates**: Refetches stale data automatically in the background.
- **Stale-While-Revalidate**: Shows cached (stale) data immediately while refetching in the background, providing a smoother UX.
- **Query Keys**: Essential for caching and invalidation. Use descriptive, serializable keys.
- **DevTools**: Use `@tanstack/react-query-devtools` to inspect query states, cached data, and trigger actions during development.
- **Server-Side Rendering (SSR) / Static Site Generation (SSG)**: React Query supports SSR/SSG with hydration, allowing you to pre-fetch data on the server and pass it to the client cache.

## 7. Refactor Areas

- **Course/Chapter Loading**: Use `useQuery` for fetching course and chapter details.
- **Search Results**: If search is client-side driven, use `useQuery` with the search term/filters in the query key.
- **Dashboard Data**: Fetch user progress, enrollments, analytics using `useQuery`.
- **Forms/Updates**: Use `useMutation` for creating/updating courses, chapters, user progress, comments, etc.

## 8. Testing

- When testing components using React Query, wrap them in the `QueryClientProvider`.
- You may need to mock the API responses or the query hooks themselves depending on the test scope. 