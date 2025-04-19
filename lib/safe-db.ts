/**
 * Safe database utilities for using Prisma in a Next.js app
 * 
 * This module provides safe patterns for accessing the database from various contexts:
 * - Server Components (direct db access)
 * - Client Components (through server actions or API routes)
 * - Service Worker / PWA contexts (through API routes)
 */

import { PrismaClient } from "@prisma/client";
import { db } from "./db";

/**
 * Safely determine if code is running on the server
 */
export const isServer = typeof window === 'undefined';

/**
 * Server-side only database access
 * Use this in server components, API routes, and server actions
 */
export { db };

/**
 * For client components, use these patterns instead of direct db access:
 * 
 * 1. Create server actions for database operations
 * 2. Use API routes
 * 
 * Example server action:
 * 
 * export async function getUser(userId: string) {
 *   'use server';
 *   
 *   const user = await db.user.findUnique({ where: { id: userId } });
 *   return user;
 * }
 */

/**
 * Helper function to wrap database operations in server-side checks
 */
export function withServerCheck<T>(
  operation: () => Promise<T>,
  fallback: T | (() => T) = (() => {
    throw new Error(
      'Database operations can only be performed on the server. Use server components, server actions, or API routes.'
    );
  })
): Promise<T> {
  if (isServer) {
    return operation();
  }

  return Promise.resolve(
    typeof fallback === 'function' ? (fallback as () => T)() : fallback
  );
}

/**
 * Type representing a function that returns a Promise
 */
export type AsyncFunction<T extends any[], R> = (...args: T) => Promise<R>;

/**
 * Decorator for server-only functions
 * This will ensure the function only runs on the server
 */
export function serverOnly<T extends any[], R>(fn: AsyncFunction<T, R>): AsyncFunction<T, R> {
  return (...args: T): Promise<R> => {
    return withServerCheck(() => fn(...args));
  };
}

/**
 * Safe database client that can be imported everywhere
 * but will throw helpful errors when used on the client
 */
export const safeDb = new Proxy(db, {
  get(target, prop) {
    const value = target[prop as keyof typeof target];
    
    if (isServer) {
      return value;
    }
    
    if (typeof value === 'function') {
      return (...args: any[]) => {
        throw new Error(
          `Cannot call db.${String(prop)} on the client. Use server components, server actions, or API routes.`
        );
      };
    }
    
    throw new Error(
      `Cannot access db.${String(prop)} on the client. Use server components, server actions, or API routes.`
    );
  }
}); 