import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

// This middleware handles authentication
export default authMiddleware({
  publicRoutes: [
    "/",
    "/en",
    "/es",
    "/en/dashboard",
    "/es/dashboard",
    "/api/webhook",
    "/sign-in",
    "/courses/(.*)/checkout",
    "/courses/(.*)",
    "/:locale/courses/(.*)"
  ],
  afterAuth(auth, req) {
    // Handle the root path redirect
    if (req.nextUrl.pathname === '/') {
      const locale = req.headers.get('accept-language')?.split(',')[0].split('-')[0] || 'en';
      const preferredLocale = ['en', 'es'].includes(locale) ? locale : 'en';
      return NextResponse.redirect(new URL(`/${preferredLocale}`, req.url));
    }
    
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    // Match all paths except for:
    // - api routes (except webhook)
    // - _next
    // - public files (favicons, images, etc.)
    // - static files
    "/((?!_next|.*\\..*|api(?!/webhook)).*)"
  ],
};
 