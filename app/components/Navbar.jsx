import Link from 'next/link';

export default function Navbar() {
  return (
    <nav style={{ background: '#18181b', color: '#fff', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <h2 style={{ margin: 0, fontSize: '20px' }}>🍹 BarCodex</h2>
      <div style={{ display: 'flex', gap: '20px' }}>
        <Link href="/ingredients" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}>
          📦 Ingrédients
        </Link>
        <Link href="/recipes" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}>
          📝 Créer
        </Link>
        <Link href="/recipes-list" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}>
          📜 Mes Recettes
        </Link>
      </div>
    </nav>
  );
}
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase'; // Ajuste les « ../ » selon l'emplacement exact de ton dossier components

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  // Ne pas afficher la barre de navigation sur la page de connexion
  if (pathname === '/login') return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const linkStyle = (path) => ({
    color: pathname === path ? '#10b981' : '#fff',
    textDecoration: 'none',
    fontWeight: pathname === path ? 'bold' : 'normal',
  });

  return (
    <nav
      style={{
        background: '#18181b',
        color: '#fff',
        padding: '15px 20px',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>🍹 BarCodex</h2>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link href="/ingredients" style={linkStyle('/ingredients')}>
            📦 Ingrédients
          </Link>
          <Link href="/recipes" style={linkStyle('/recipes')}>
            📝 Créer
          </Link>
          <Link href="/recipes-list" style={linkStyle('/recipes-list')}>
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
          fontSize: '13px',
        }}
      >
        Déconnexion
      </button>
    </nav>
  );
}