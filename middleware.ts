import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const tokenQuery = url.searchParams.get('token');
  const existingToken = request.cookies.get('whop_user_token')?.value;
  const response = NextResponse.next();

  // Whop injects x-whop-user-token header on iframe requests,
  // but we also maintain a SESSION cookie for fast auth on page refreshes.
  // Key difference from before: NO maxAge — cookie dies when browser closes,
  // preventing the 1-hour stale identity issue on account switches.
  if (tokenQuery) {
    // Fresh URL token from Whop iframe load — ALWAYS takes priority
    response.headers.set('x-whop-user-token', tokenQuery);
    response.cookies.set('whop_user_token', tokenQuery, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      // No maxAge = session cookie — expires when browser closes
      path: '/',
    });
  } else if (existingToken) {
    // Fallback: use session cookie for page refreshes within the iframe
    response.headers.set('x-whop-user-token', existingToken);
  }

  return response;
}

// Run on all routes except static assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};