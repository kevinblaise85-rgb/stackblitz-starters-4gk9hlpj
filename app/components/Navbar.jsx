'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <nav
      style={{
        background: '#18181b',
        color: '#fff',
        padding: '12px 20px',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link
          href="/"
          style={{
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          🍹 BarCodex
        </Link>

        {/* LIENS DE NAVIGATION */}
        <div style={{ display: 'flex', gap: '15px' }}>
          <Link
            href="/"
            style={{
              color: pathname === '/' ? '#10b981' : '#fff',
              textDecoration: 'none',
              fontWeight: pathname === '/' ? 'bold' : 'normal',
            }}
          >
            📊 Tableau de bord
          </Link>

          <Link
            href="/ingredients"
            style={{
              color: pathname === '/ingredients' ? '#10b981' : '#fff',
              textDecoration: 'none',
              fontWeight: pathname === '/ingredients' ? 'bold' : 'normal',
            }}
          >
            📦 Ingrédients
          </Link>

          <Link
            href="/recipes"
            style={{
              color: pathname === '/recipes' ? '#10b981' : '#fff',
              textDecoration: 'none',
              fontWeight: pathname === '/recipes' ? 'bold' : 'normal',
            }}
          >
            📝 Créer
          </Link>

          <Link
            href="/recipes-list"
            style={{
              color: pathname === '/recipes-list' ? '#10b981' : '#fff',
              textDecoration: 'none',
              fontWeight: pathname === '/recipes-list' ? 'bold' : 'normal',
            }}
          >
            📜 Mes Recettes
          </Link>
        </div>
      </div>

      <button
        onClick={handleLogout}
        style={{
          background: '#ef4444',
          color: '#fff',
          border: 'none',
          padding: '6px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Déconnexion
      </button>
    </nav>
  );
}