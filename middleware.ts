import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { awardDailyLoginPoints } from "./lib/actions/points";

// These paths will not update streaks to avoid unnecessary database operations
const EXCLUDED_PATHS = [
  /^\/api\/.*$/, // Skip API routes
  /^\/\_next\/.*$/, // Skip Next.js internals
  /^\/favicon\.ico$/, // Skip favicon
  /^\/.*\.(jpe?g|png|gif|svg|css|js)$/, // Skip static assets
];

// This middleware protects all routes including api/trpc routes
export default authMiddleware({
  publicRoutes: [
    '/',
    '/sign-in',
    '/sign-in/(.*)',
    '/sign-up',
    '/sign-up/(.*)',
    '/api/webhook',
    '/api/webhook/(.*)',
    '/courses',
    '/courses/:path',
    '/certificates/verify/:id',
  ],
  async afterAuth(auth, req) {
    // Only process for authenticated users on non-excluded paths
    if (auth.userId && 
        !EXCLUDED_PATHS.some(pattern => pattern.test(req.nextUrl.pathname))) {
      
      try {
        // Instead of directly calling streak service, we'll record the user visit
        // and let a server action handle it when appropriate
        
        // Set a header that server components can use to trigger streak updates
        const response = NextResponse.next();
        response.headers.set('X-User-Visit', 'true');
        
        // Award daily login points if user is authenticated (only on HTML page loads, not API calls)
        if (!req.nextUrl.pathname.startsWith('/api/') && req.headers.get('accept')?.includes('text/html')) {
          try {
            // Run asynchronously to avoid blocking the request
            await awardDailyLoginPoints(auth.userId).catch((error) => {
              console.error("[DAILY_LOGIN_POINTS_ERROR]", error);
            });
          } catch (error) {
            // Don't fail the request if points can't be awarded
            console.error("[DAILY_LOGIN_POINTS_ERROR]", error);
          }
        }
        
        return response;
      } catch (error) {
        console.error("Error in middleware:", error);
      }
    }
    
    // Continue with the request
    return NextResponse.next();
  }
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
 