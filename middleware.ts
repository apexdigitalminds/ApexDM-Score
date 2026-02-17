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

  // ============================================================
  // 🔑 IDENTITY BLEED FIX
  //
  // ROOT CAUSE: The Whop proxy reads our stale `whop_user_token` cookie
  // and uses it as the x-whop-user-token header. Even after an account
  // switch, the proxy sends the OLD user's JWT in the header.
  //
  // Whop's OWN cookies (whop-core.user-id, whop-core.uid-token) update
  // correctly on account switch.
  //
  // FIX: Detect the mismatch. If our stale cookie is present, delete it
  // and redirect. The proxy's next request (without our stale cookie)
  // will use Whop's correct session cookies to generate a fresh token.
  // ============================================================
  const headerToken = request.headers.get('x-whop-user-token');
  const whopCoreUserId = request.cookies.get('whop-core.user-id')?.value;
  const ourCookie = request.cookies.get('whop_user_token')?.value;

  if (headerToken && whopCoreUserId) {
    const headerClaims = decodeJwtPayload(headerToken);
    if (headerClaims) {
      const headerUser = headerClaims.userId || headerClaims.sub;

      if (headerUser && headerUser !== whopCoreUserId) {
        console.log(`🔑 IDENTITY MISMATCH DETECTED!`);
        console.log(`   Header (proxy): ${headerUser} (STALE)`);
        console.log(`   Whop session:   ${whopCoreUserId} (CORRECT)`);
        console.log(`   Our cookie present: ${!!ourCookie}`);

        if (ourCookie) {
          // Our stale cookie is the cause. Delete it and redirect.
          // The proxy's next request will use Whop's session cookies.
          console.log(`   → Deleting stale cookie and redirecting...`);
          const redirectUrl = new URL(url);
          const redirectResponse = NextResponse.redirect(redirectUrl);

          // Aggressively delete the cookie with all possible attribute combos
          redirectResponse.cookies.set('whop_user_token', '', {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/',
            maxAge: 0,
          });

          redirectResponse.headers.set('Cache-Control', 'no-store');
          return redirectResponse;
        } else {
          // Cookie already deleted but proxy STILL sending stale token.
          // This shouldn't happen, but if it does, log it for debugging.
          console.warn(`   → Cookie already deleted but proxy still stale!`);
          console.warn(`   → Cannot fix server-side — proxy issue.`);
        }
      }
    }
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

  // Always try to delete our legacy cookie on every response
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