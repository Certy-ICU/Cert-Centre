import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
// And prevent Prisma Client from running in browser environments
const prismaClientSingleton = () => {
  // Only instantiate PrismaClient on the server
  if (typeof window === 'undefined') {
    return new PrismaClient();
  }
  
  // Return a placeholder for client-side that won't break things
  // This allows the import to work in client components without errors
  return new Proxy({} as PrismaClient, {
    get: () => {
      throw new Error(
        'PrismaClient is not available in browser environments. Use server components, server actions, or API routes for database access.'
      );
    },
  });
};

export const db = globalThis.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
