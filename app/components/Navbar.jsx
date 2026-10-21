'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  // Ne pas afficher la barre de navigation sur la page de connexion
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return null;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navLinks = [
    { href: '/', label: '📊 Dashboard' },
    { href: '/ingredients', label: '📦 Ingrédients' },
    { href: '/preparations', label: '🧪 Maison' },
    { href: '/recipes', label: '🍹 Recettes' },
  ];

  return (
    <nav
      style={{
        background: '#18181b',
        borderBottom: '1px solid #374151',
        padding: '15px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '18px', color: '#10b981', fontWeight: 'bold' }}>
          🍹 BarCodex
        </h1>

        <div style={{ display: 'flex', gap: '15px' }}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  color: isActive ? '#10b981' : '#d1d5db',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: isActive ? 'bold' : 'normal',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  background: isActive ? '#10b98122' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleLogout}
        style={{
          background: '#ef444422',
          color: '#ef4444',
          border: '1px solid #ef4444',
          padding: '6px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 'bold',
        }}
      >
        Déconnexion
      </button>
    </nav>
  );
}