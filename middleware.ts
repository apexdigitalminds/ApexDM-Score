import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const tokenQuery = url.searchParams.get('token');
  const existingToken = request.cookies.get('whop_user_token')?.value;

  // Determine the active token: URL param > cookie > native Whop header
  const activeToken = tokenQuery || existingToken;

  // 🔑 CRITICAL: Modify REQUEST headers, not response headers.
  // Server components read headers via `headers()` from `next/headers`,
  // which only sees request headers. `response.headers.set()` sets
  // response headers that server components CANNOT see.
  const requestHeaders = new Headers(request.headers);
  if (activeToken) {
    requestHeaders.set('x-whop-user-token', activeToken);
  }

  // Pass modified request headers to server components
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 🚫 ANTI-CACHE: Prevent browser/CDN from caching auth-dependent pages
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  // Persist token as session cookie for subsequent page loads
  if (tokenQuery) {
    response.cookies.set('whop_user_token', tokenQuery, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      // No maxAge = session cookie — expires when browser closes
      path: '/',
    });
  }

  return response;
}

// Run on all routes except static assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};