'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function AuthCheck() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Ne rien vérifier si on est déjà sur la page de login ou d'inscription
    if (pathname.startsWith('/login') || pathname.startsWith('/register')) return;

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      }
    };

    checkUser();
  }, [pathname, router]);

  return null;
}
import './globals.css';
import AuthCheck from './AuthCheck';
import Navbar from './components/Navbar';

export const metadata = {
  title: 'BarCodex',
  description: 'Gestion de bar et recettes',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ background: '#121212', color: '#fff', margin: 0, fontFamily: 'sans-serif' }}>
        <AuthCheck />
        <Navbar />
        {children}
      </body>
    </html>
  );
}