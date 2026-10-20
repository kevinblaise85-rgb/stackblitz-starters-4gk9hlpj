import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();

  // Création du client Supabase standard
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Récupération du token de session depuis les cookies
  const token = req.cookies.get('sb-access-token')?.value || req.cookies.get('supabase-auth-token')?.value;

  // Si l'utilisateur n'a pas de cookie de session et qu'il tente d'accéder à une page protégée
  const isAuthPage = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register');

  // Remarque : Si tu veux vérifier la session directement via auth.getUser avec le token
  const authHeader = req.headers.get('authorization');

  // Redirection vers /login si non connecté
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