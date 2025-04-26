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
  ],
};