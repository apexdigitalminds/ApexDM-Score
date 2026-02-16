import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const tokenQuery = url.searchParams.get('token');
  const response = NextResponse.next();

  // Pass URL token as header for initial iframe load.
  // Whop natively injects x-whop-user-token on all subsequent
  // same-origin requests from within the iframe — no cookie needed.
  // Removing cookie persistence eliminates identity bleed when
  // users switch Whop accounts in the same browser.
  if (tokenQuery) {
    response.headers.set('x-whop-user-token', tokenQuery);
  }

  return response;
}

// Run on all routes except static assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};