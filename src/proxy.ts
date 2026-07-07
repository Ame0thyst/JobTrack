import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

/**
 * Next.js 16 Proxy (formerly Middleware).
 * File must be named proxy.ts and export function named 'proxy'.
 * Handles authentication routing for all non-API, non-static routes.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that do not require authentication
  const isAuthPage =
    pathname.startsWith('/login') || pathname.startsWith('/register');

  // Use NextAuth session to check authentication
  const session = await auth();
  const isAuthenticated = !!session;

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isAuthPage) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthPage) {
    const dashboardUrl = new URL('/', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except API routes, static files, and Next.js internals
    // API routes are protected individually at the handler level via getCurrentUser()
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
