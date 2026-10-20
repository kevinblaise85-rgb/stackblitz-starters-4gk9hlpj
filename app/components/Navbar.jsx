'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (data && !error) {
          setRole(data.role);
        }
      }
    };

    fetchUserRole();
  }, []);

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
            href="/preparations"
            style={{
              color: pathname === '/preparations' ? '#10b981' : '#fff',
              textDecoration: 'none',
              fontWeight: pathname === '/preparations' ? 'bold' : 'normal',
            }}
          >
            🧪 Ingrédients Maison
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

          <Link
            href="/stock"
            style={{
              color: pathname === '/stock' ? '#10b981' : '#fff',
              textDecoration: 'none',
              fontWeight: pathname === '/stock' ? 'bold' : 'normal',
            }}
          >
            📉 Stock & Pertes
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* BADGE DE RÔLE */}
        {role && (
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              backgroundColor: role === 'admin' ? '#10b98122' : '#f59e0b22',
              color: role === 'admin' ? '#10b981' : '#f59e0b',
              border: `1px solid ${role === 'admin' ? '#10b981' : '#f59e0b'}`,
              fontWeight: 'bold',
              fontSize: '12px',
            }}
          >
            {role === 'admin' ? '👑 Admin' : '👤 Staff'}
          </span>
        )}

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
      </div>
    </nav>
  );
}