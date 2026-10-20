'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function DashboardPage() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile) setRole(profile.role);
      }
      setLoading(false);
    };

    fetchUserRole();
  }, []);

  if (loading) return <div style={{ padding: '30px', color: '#fff' }}>Chargement...</div>;

  // 🔒 SÉCURITÉ : Bloquer l'accès si l'utilisateur est "staff"
  if (role === 'staff') {
    return (
      <main style={{ padding: '50px', textAlign: 'center', color: '#fff' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '10px' }}>🔒</h1>
        <h2>Accès Restreint</h2>
        <p style={{ color: '#9ca3af', marginTop: '10px' }}>
          Le tableau de bord et les statistiques financières sont réservés à la gérance.
        </p>
      </main>
    );
  }

  // 👑 Vue Admin (Tableau de bord complet)
  return (
    <main style={{ padding: '30px', maxWidth: '1100px', margin: '0 auto', color: '#fff' }}>
      <h2>📊 Tableau de Bord (Gérance)</h2>
      <p style={{ color: '#9ca3af' }}>Vue d'ensemble des performances financières et des stocks.</p>

      {/* Tes cartes et graphiques du Dashboard ici */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <div style={{ background: '#1f2937', padding: '20px', borderRadius: '8px', border: '1px solid #374151' }}>
          <h3 style={{ margin: 0, color: '#10b981' }}>Chiffre d'Affaires</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0 0 0' }}>-- €</p>
        </div>
        <div style={{ background: '#1f2937', padding: '20px', borderRadius: '8px', border: '1px solid #374151' }}>
          <h3 style={{ margin: 0, color: '#f59e0b' }}>Marge Moyenne</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0 0 0' }}>-- %</p>
        </div>
      </div>
    </main>
  );
}