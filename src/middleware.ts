import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// List of public routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup'];

// List of paths that should be excluded from middleware
const excludedPaths = [
  '/api', // API routes
  '/_next', // Next.js internal routes
  '/static', // Static files
  '/favicon.ico', // Favicon
  '/public', // Public folder
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for excluded paths
  if (excludedPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });

  // Allow access to public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Redirect to login if no token is present
  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Handle role-based routing
  const isArtist = token.role === 'ARTIST';
  const isExec = token.role === 'EXEC';
  const isRep = token.role === 'REP';
  const isAdmin = token.role === 'ADMIN';
  const isOnArtistRoute = pathname.startsWith('/artist');
  const isOnExecRoute = pathname.startsWith('/exec') || pathname === '/explore';
  const isOnRepRoute = pathname.startsWith('/rep');
  const isOnAdminRoute = pathname.startsWith('/admin');

  // TODO: Add tier-based restrictions here when needed
  // For now, tiers share the same routes within their role
  const userTier = token.tier as string | undefined;

  // Redirect artists trying to access exec/rep/admin routes
  if (isArtist && (isOnExecRoute || isOnRepRoute || isOnAdminRoute)) {
    return NextResponse.redirect(new URL('/artist/dashboard', request.url));
  }

  // Redirect execs trying to access artist/rep/admin routes
  if (isExec && (isOnArtistRoute || isOnRepRoute || isOnAdminRoute)) {
    return NextResponse.redirect(new URL('/exec/dashboard', request.url));
  }

  // Redirect reps trying to access artist/exec/admin routes
  if (isRep && (isOnArtistRoute || isOnExecRoute || isOnAdminRoute)) {
    return NextResponse.redirect(new URL('/rep/dashboard', request.url));
  }

  // Redirect admins to admin dashboard if not on admin routes
  if (isAdmin && !isOnAdminRoute && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // Ensure users are on their correct role-based routes
  if (isArtist && !isOnArtistRoute && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/artist/dashboard', request.url));
  }

  if (isExec && !isOnExecRoute && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/exec/dashboard', request.url));
  }

  if (isRep && !isOnRepRoute && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/rep/dashboard', request.url));
  }

  // Handle /explore redirect for execs
  if (isExec && pathname === '/explore') {
    return NextResponse.redirect(new URL('/exec/explore', request.url));
  }

  // Handle /exec redirect to dashboard
  if (isExec && pathname === '/exec') {
    return NextResponse.redirect(new URL('/exec/dashboard', request.url));
  }

  // Check if the path starts with /admin
  if (pathname.startsWith('/admin')) {
    if (token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/).*)',
    '/admin/:path*',
  ],
};