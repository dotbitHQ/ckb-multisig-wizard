"use server"

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/') {
    return NextResponse.next();
  }

  // console.log('Middleware executed:', request.nextUrl.pathname);

  const pubKeyHash = cookies().get('pubKeyHash')?.value;

  if (!pubKeyHash) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    } else {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Verify user existence
  try {
    const authResponse = await fetch(`${request.nextUrl.origin}/api/auth?verify=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pubKeyHash }),
    });

    const authData = await authResponse.json();

    if (!authData.result) {
      // User not found, clear the cookie and redirect to login
      const response = NextResponse.redirect(new URL('/?error=User not found', request.url));
      response.cookies.delete('pubKeyHash');
      return response;
    }
  } catch (error) {
    console.error('Error verifying user:', error);
    return NextResponse.redirect(new URL('/?error=Error verifying user', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/auth).*)',
    '/list/:path*',
    '/upload/:path*',
  ],
};
