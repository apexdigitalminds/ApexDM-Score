import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Decode JWT payload WITHOUT verification (for comparison only)
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

  // Strip stale ?token= via redirect
  if (url.searchParams.has('token')) {
    const cleanUrl = new URL(url);
    cleanUrl.searchParams.delete('token');
    const redirectResponse = NextResponse.redirect(cleanUrl);
    redirectResponse.headers.set('Cache-Control', 'no-store');
    return redirectResponse;
  }

  const requestHeaders = new Headers(request.headers);

  // ============================================================
  // 🔑 IDENTITY BLEED FIX
  //
  // ROOT CAUSE: Whop's proxy reads our stale `whop_user_token` cookie
  // and uses it as the x-whop-user-token header. Even after account
  // switch, the proxy sends the OLD user's JWT.
  //
  // FIX: Compare the header's userId with Whop's own `whop-core.uid-token`
  // cookie (which IS updated correctly). If they differ, override the
  // header with the correct cookie token.
  // ============================================================
  const headerToken = request.headers.get('x-whop-user-token');
  const whopCoreToken = request.cookies.get('whop-core.uid-token')?.value;

  if (headerToken && whopCoreToken) {
    const headerClaims = decodeJwtPayload(headerToken);
    const cookieClaims = decodeJwtPayload(whopCoreToken);

    if (headerClaims && cookieClaims) {
      const headerUser = headerClaims.userId || headerClaims.sub;
      const cookieUser = cookieClaims.userId || cookieClaims.sub;

      if (headerUser !== cookieUser) {
        console.log(`🔑 IDENTITY MISMATCH DETECTED!`);
        console.log(`   Header says: ${headerUser} (STALE — from proxy)`);
        console.log(`   Cookie says: ${cookieUser} (CORRECT — from Whop session)`);
        console.log(`   Overriding header with correct cookie token`);

        // Replace the stale header token with Whop's correct cookie token
        requestHeaders.set('x-whop-user-token', whopCoreToken);
      }
    }
  } else if (!headerToken && whopCoreToken) {
    // No header but cookie exists — use the cookie
    console.log(`🔑 No header token, using whop-core.uid-token cookie`);
    requestHeaders.set('x-whop-user-token', whopCoreToken);
  }

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

  // Aggressively delete our stale cookie — THIS is what the proxy was reading
  if (request.cookies.has('whop_user_token')) {
    response.cookies.set('whop_user_token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 0, // Expire immediately
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};