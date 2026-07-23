import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';

// Define routing exclusions and protect client side routes.
const isClientProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/onboarding(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;

  // Custom admin path protection
  if (url.pathname.startsWith('/admin')) {
    // Exclude static assets inside admin or login routes
    if (
      url.pathname === '/admin/login' ||
      url.pathname === '/admin/api/login' ||
      url.pathname.startsWith('/_next') ||
      url.pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    const decoded = await verifyJWT(token);
    if (!decoded) {
      // Clear cookie and redirect
      const res = NextResponse.redirect(new URL('/admin/login', req.url));
      res.cookies.delete('admin_session');
      return res;
    }

    return NextResponse.next();
  }

  // standard Clerk protection for normal customers
  if (isClientProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
