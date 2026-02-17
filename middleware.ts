import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Decode JWT payload WITHOUT verification (for logging only)
function decodeJwtPayload(jwt: string): Record<string, any> | null {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // ============================================================
  // 🔍 DIAGNOSTIC LOGGING — DEEP TOKEN ANALYSIS
  // ============================================================
  const whopHeader = request.headers.get('x-whop-user-token');
  const tokenParam = url.searchParams.get('token');
  const whopCoreUidToken = request.cookies.get('whop-core.uid-token')?.value;
  const whopCoreUserId = request.cookies.get('whop-core.user-id')?.value;
  const ourCookie = request.cookies.get('whop_user_token')?.value;

  console.log(`🔬 ==================== MIDDLEWARE DEBUG ====================`);
  console.log(`🔬 URL: ${url.pathname}${url.search}`);
  console.log(`🔬 ?token= param: ${!!tokenParam}`);
  console.log(`🔬 x-whop-user-token header: ${!!whopHeader}`);
  console.log(`🔬 whop-core.uid-token cookie: ${!!whopCoreUidToken}`);
  console.log(`🔬 whop-core.user-id cookie: ${whopCoreUserId || 'none'}`);
  console.log(`🔬 our whop_user_token cookie: ${!!ourCookie}`);

  // Decode the HEADER token
  if (whopHeader) {
    const headerClaims = decodeJwtPayload(whopHeader);
    console.log(`🔬 HEADER JWT claims:`, JSON.stringify({
      userId: headerClaims?.userId || headerClaims?.sub,
      iat: headerClaims?.iat,
      exp: headerClaims?.exp,
      iatDate: headerClaims?.iat ? new Date(headerClaims.iat * 1000).toISOString() : 'N/A',
      expDate: headerClaims?.exp ? new Date(headerClaims.exp * 1000).toISOString() : 'N/A',
      roles: headerClaims?.roles,
      experienceId: headerClaims?.experienceId,
    }));
  }

  // Decode the whop-core.uid-token cookie
  if (whopCoreUidToken) {
    const cookieClaims = decodeJwtPayload(whopCoreUidToken);
    if (cookieClaims) {
      console.log(`🔬 COOKIE (whop-core.uid-token) JWT claims:`, JSON.stringify({
        userId: cookieClaims?.userId || cookieClaims?.sub,
        iat: cookieClaims?.iat,
        exp: cookieClaims?.exp,
      }));
    } else {
      console.log(`🔬 COOKIE (whop-core.uid-token) is NOT a JWT (value: ${whopCoreUidToken.substring(0, 20)}...)`);
    }
  }

  // Decode our legacy cookie
  if (ourCookie) {
    const ourClaims = decodeJwtPayload(ourCookie);
    if (ourClaims) {
      console.log(`🔬 OUR COOKIE JWT claims:`, JSON.stringify({
        userId: ourClaims?.userId || ourClaims?.sub,
        iatDate: ourClaims?.iat ? new Date(ourClaims.iat * 1000).toISOString() : 'N/A',
      }));
    }
  }

  // Compare: are the header and cookie the SAME user?
  if (whopHeader && whopCoreUidToken) {
    const h = decodeJwtPayload(whopHeader);
    const c = decodeJwtPayload(whopCoreUidToken);
    if (h && c) {
      const headerUser = h.userId || h.sub;
      const cookieUser = c.userId || c.sub;
      console.log(`🔬 MATCH CHECK: header=${headerUser} vs cookie=${cookieUser} → ${headerUser === cookieUser ? 'SAME' : '⚠️ DIFFERENT!'}`);
    }
  }
  console.log(`🔬 ==========================================================`);
  // ============================================================

  // Strip stale ?token= via redirect
  if (url.searchParams.has('token')) {
    const cleanUrl = new URL(url);
    cleanUrl.searchParams.delete('token');
    const redirectResponse = NextResponse.redirect(cleanUrl);
    redirectResponse.headers.set('Cache-Control', 'no-store');
    return redirectResponse;
  }

  const requestHeaders = new Headers(request.headers);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Prevent caching
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');

  // Clean up our legacy cookie
  if (request.cookies.has('whop_user_token')) {
    response.cookies.delete('whop_user_token');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};