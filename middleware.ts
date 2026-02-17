import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // 🔑 CRITICAL: Strip stale ?token= from the URL via redirect.
  // The Whop Proxy prioritizes ?token= over the active session cookie.
  // If the URL has a leftover token from a previous user, the proxy will
  // inject THAT stale token into x-whop-user-token, ignoring the new user's
  // session. Redirecting to a clean URL forces the proxy to use the active
  // session cookie and generate a fresh token for the correct user.
  if (url.searchParams.has('token')) {
    const cleanUrl = new URL(url);
    cleanUrl.searchParams.delete('token');
    return NextResponse.redirect(cleanUrl);
  }

  const requestHeaders = new Headers(request.headers);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Prevent caching of authenticated pages
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');

  // Clean up legacy cookies
  if (request.cookies.has('whop_user_token')) {
    response.cookies.delete('whop_user_token');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};