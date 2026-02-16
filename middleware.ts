import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Whop's reverse proxy injects x-whop-user-token header on EVERY request
  // (including initial iframe navigation). No cookie needed.
  //
  // IMPORTANT: Do NOT persist the token in a cookie.
  // Cookies cause identity bleed when users switch Whop accounts — the stale
  // cookie overwrites the fresh token that Whop's proxy provides.

  const url = request.nextUrl;
  const tokenQuery = url.searchParams.get('token');

  // Build request headers — only override if URL has explicit ?token= param
  const requestHeaders = new Headers(request.headers);
  if (tokenQuery) {
    requestHeaders.set('x-whop-user-token', tokenQuery);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Prevent caching of authenticated pages
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  // Clear any leftover cookie from previous code versions
  if (request.cookies.has('whop_user_token')) {
    response.cookies.delete('whop_user_token');
  }

  return response;
}

// Run on all routes except static assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};