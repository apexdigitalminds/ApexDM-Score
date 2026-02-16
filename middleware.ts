import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const tokenQuery = url.searchParams.get('token');
  const nativeWhopToken = request.headers.get('x-whop-user-token');
  const cookieToken = request.cookies.get('whop_user_token')?.value;

  // 🔑 TOKEN PRIORITY (most fresh → least fresh):
  //   1. URL ?token= param  (Whop passes this on iframe load)
  //   2. Native x-whop-user-token header  (Whop injects on every iframe request)
  //   3. Cookie  (our fallback for page refreshes when Whop header is absent)
  //
  // CRITICAL: We must NOT let a stale cookie override Whop's fresh native header.
  // The old bug: cookie was checked before the native header, overwriting it.
  const activeToken = tokenQuery || nativeWhopToken || cookieToken;

  // Modify REQUEST headers so server components see the token via headers()
  const requestHeaders = new Headers(request.headers);
  if (activeToken) {
    requestHeaders.set('x-whop-user-token', activeToken);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Prevent browser/CDN from caching auth-dependent pages
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  // Update cookie when we have a fresher token (URL param or native header)
  // This keeps the cookie in sync so it's accurate for future fallback use
  const freshToken = tokenQuery || nativeWhopToken;
  if (freshToken && freshToken !== cookieToken) {
    response.cookies.set('whop_user_token', freshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });
  }

  return response;
}

// Run on all routes except static assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};