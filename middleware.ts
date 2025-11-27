import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  
  // 1. Capture Token from URL (Whop passes this in the iframe src)
  const tokenQuery = url.searchParams.get('token');
  
  // 2. Capture Token from Cookies (If we saved it previously)
  const tokenCookie = request.cookies.get('whop_user_token')?.value;
  
  const response = NextResponse.next();

  // 3. If Token is in URL, save it to Cookies and Headers
  if (tokenQuery) {
    response.cookies.set('whop_user_token', tokenQuery, { 
      httpOnly: true, 
      secure: true, 
      sameSite: 'none', // Required for iframes
      path: '/' 
    });
    response.headers.set('x-whop-user-token', tokenQuery);
  } 
  // 4. If Token is in Cookies, ensure it's in Headers for the SDK
  else if (tokenCookie) {
    response.headers.set('x-whop-user-token', tokenCookie);
  }

  return response;
}

// Run on all routes except static assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};