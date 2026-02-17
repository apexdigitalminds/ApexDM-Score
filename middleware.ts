import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Whop's reverse proxy injects x-whop-user-token header on EVERY request.
  // Trust the proxy — do NOT read ?token= from the URL or use cookies.
  //
  // WHY: The iframe URL's ?token= param is "sticky" — it persists from the
  // previous user's session even after account switches. If we read it, we
  // overwrite the proxy's fresh header with a stale token, causing identity bleed.

  const requestHeaders = new Headers(request.headers);

  // ❌ REMOVED: Do NOT read ?token= from URL — it can be stale.
  // The Whop proxy has already put the correct token in x-whop-user-token.

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