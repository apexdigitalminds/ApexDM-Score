import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // Capture Token from URL (Whop passes this in the iframe src)
  const tokenQuery = url.searchParams.get('token');

  const response = NextResponse.next();

  // 🔒 SECURITY FIX: Only use fresh token from URL, never cache in cookies
  // This prevents identity bleed when users switch accounts
  // Previously: Cookie persisted and could return wrong user on warm serverless instances
  if (tokenQuery) {
    response.headers.set('x-whop-user-token', tokenQuery);
  }
  // If no token in URL, Whop SDK will handle gracefully (user sees landing page)

  return response;
}

// Run on all routes except static assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};