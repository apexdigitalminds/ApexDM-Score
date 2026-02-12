import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // Capture Token from URL (Whop passes this in the iframe src)
  const tokenQuery = url.searchParams.get('token');
  const existingToken = request.cookies.get('whop_user_token')?.value;

  const response = NextResponse.next();

  // 🔒 SECURITY: Priority order — fresh URL token > existing cookie
  // Fresh URL tokens ALWAYS override cookies (prevents identity bleed on account switch)
  // Cookie is used as fallback for page refreshes within the iframe session
  if (tokenQuery) {
    response.headers.set('x-whop-user-token', tokenQuery);
    // Persist for subsequent navigations/refreshes within the iframe
    response.cookies.set('whop_user_token', tokenQuery, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',   // Required for Whop iframe context
      maxAge: 3600,        // 1 hour max, refreshed on each new URL token
      path: '/',
    });
  } else if (existingToken) {
    // Fallback: use persisted cookie for page refreshes
    response.headers.set('x-whop-user-token', existingToken);
  }
  // If neither token nor cookie exists, Whop SDK handles gracefully

  return response;
}

// Run on all routes except static assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};