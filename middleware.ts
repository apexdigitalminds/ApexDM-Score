import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // ============================================================
  // 🔍 DIAGNOSTIC LOGGING — remove after fixing identity bleed
  // ============================================================
  const whopHeader = request.headers.get('x-whop-user-token');
  const tokenParam = url.searchParams.get('token');
  const allCookies = request.cookies.getAll().map(c => c.name).join(', ');

  console.log(`🔬 ==================== MIDDLEWARE DEBUG ====================`);
  console.log(`🔬 URL: ${url.pathname}${url.search}`);
  console.log(`🔬 Has ?token= param: ${!!tokenParam} (length: ${tokenParam?.length || 0})`);
  console.log(`🔬 Has x-whop-user-token header: ${!!whopHeader} (length: ${whopHeader?.length || 0})`);
  console.log(`🔬 Cookies present: [${allCookies || 'none'}]`);
  console.log(`🔬 Referer: ${request.headers.get('referer') || 'none'}`);
  console.log(`🔬 User-Agent: ${request.headers.get('user-agent')?.substring(0, 50) || 'none'}`);

  // Log first/last 10 chars of each token to compare WITHOUT exposing full JWT
  if (tokenParam) {
    console.log(`🔬 ?token= fingerprint: ${tokenParam.substring(0, 10)}...${tokenParam.substring(tokenParam.length - 10)}`);
  }
  if (whopHeader) {
    console.log(`🔬 header fingerprint:  ${whopHeader.substring(0, 10)}...${whopHeader.substring(whopHeader.length - 10)}`);
  }

  // Are they the SAME token or DIFFERENT?
  if (tokenParam && whopHeader) {
    console.log(`🔬 Tokens match: ${tokenParam === whopHeader}`);
  }
  console.log(`🔬 ==========================================================`);
  // ============================================================

  // Strip stale ?token= via redirect to force proxy to use active session
  if (url.searchParams.has('token')) {
    console.log(`🔬 REDIRECTING to strip ?token= param`);
    const cleanUrl = new URL(url);
    cleanUrl.searchParams.delete('token');
    const redirectResponse = NextResponse.redirect(cleanUrl);
    // Set no-cache on redirect too
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

  // Clean up legacy cookies
  if (request.cookies.has('whop_user_token')) {
    response.cookies.delete('whop_user_token');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};