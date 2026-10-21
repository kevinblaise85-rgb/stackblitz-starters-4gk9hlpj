import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const token = req.cookies.get('sb-access-token')?.value || req.cookies.get('supabase-auth-token')?.value;

  const isAuthPage = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register');

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};