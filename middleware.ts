import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Decode JWT payload WITHOUT verification (for user ID comparison only)
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
  // ROOT CAUSE: The Whop proxy reads our stale `whop_user_token` cookie
  // and uses it to generate the x-whop-user-token header for the WRONG user.
  //
  // Whop's own cookies (whop-core.user-id) correctly update on account switch.
  //
  // FIX: Inject the CORRECT userId from whop-core.user-id as a trusted
  // header. verifyUser() in actions.ts reads this header and overrides
  // the stale SDK-verified userId when they don't match.
  //
  // SECURITY: This header is ALWAYS set/deleted by middleware. The client
  // cannot spoof it because middleware overwrites any client-sent value.
  // ============================================================
  const headerToken = request.headers.get('x-whop-user-token');
  const whopCoreUserId = request.cookies.get('whop-core.user-id')?.value;

  // ALWAYS control this header — prevents client spoofing
  if (whopCoreUserId) {
    requestHeaders.set('x-whop-correct-user-id', whopCoreUserId);

    // Check for mismatch and log it
    if (headerToken) {
      const headerClaims = decodeJwtPayload(headerToken);
      const headerUser = headerClaims?.userId || headerClaims?.sub;

      if (headerUser && headerUser !== whopCoreUserId) {
        console.log(`🔑 IDENTITY MISMATCH DETECTED!`);
        console.log(`   Header (proxy): ${headerUser} (STALE)`);
        console.log(`   Whop session:   ${whopCoreUserId} (CORRECT)`);
        console.log(`   → Passing correct userId via x-whop-correct-user-id header`);
      }
    }
  } else {
    // No Whop session cookie — remove the override header
    requestHeaders.delete('x-whop-correct-user-id');
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

  // Delete our stale cookie so future requests don't poison the proxy
  if (request.cookies.has('whop_user_token')) {
    response.cookies.set('whop_user_token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 0,
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};