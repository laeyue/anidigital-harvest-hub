import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Extract Supabase project reference from URL
// URL format: https://<project-ref>.supabase.co
const getSupabaseProjectRef = (): string | null => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  
  try {
    const url = new URL(supabaseUrl);
    // Extract project reference from hostname (e.g., "suoqctrweiqqkiqzfxha" from "suoqctrweiqqkiqzfxha.supabase.co")
    const hostname = url.hostname;
    const match = hostname.match(/^([^.]+)\.supabase\.co$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if accessing protected routes
  if (pathname.startsWith('/app')) {
    // Supabase stores session in cookies with pattern: sb-<project-ref>-auth-token
    // Get project reference from environment variable
    const projectRef = getSupabaseProjectRef();
    
    if (!projectRef) {
      // If we can't determine the project ref, allow the request through
      // The client-side auth check will handle it
      console.warn('[Middleware] Could not extract Supabase project ref from NEXT_PUBLIC_SUPABASE_URL');
      return NextResponse.next();
    }
    
    // Check for Supabase auth cookie
    const supabaseCookie = request.cookies.get(`sb-${projectRef}-auth-token`);
    
    // If no session cookie, redirect to login
    if (!supabaseCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/app/:path*',
  ],
};

