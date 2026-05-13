import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;
  const pathname = request.nextUrl.pathname;

  const publicRoutes = ['/login', '/api/auth/login', '/api/auth/logout', '/'];
  const isPublicRoute = publicRoutes.includes(pathname);

  if (isPublicRoute) {
    return NextResponse.next();
  }

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const protectedAdminRoutes = ['/admin'];
  const isAdminRoute = protectedAdminRoutes.some(route => pathname.startsWith(route));

  if (isAdminRoute && !['admin', 'editor'].includes(userRole || '')) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/auth/logout',
  ],
};
