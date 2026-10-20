'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState([]);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // 1. Récupérer le rôle
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile) setRole(profile.role);

      // 2. Récupérer la liste des ingrédients
      const { data } = await supabase.from('ingredients').select('*');
      if (data) setIngredients(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet ingrédient ?')) return;
    await supabase.from('ingredients').delete().eq('id', id);
    setIngredients(ingredients.filter((i) => i.id !== id));
  };

  if (loading) return <div style={{ padding: '30px', color: '#fff' }}>Chargement...</div>;

  return (
    <main style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', color: '#fff' }}>
      <h2>📦 Gestion des Ingrédients</h2>

      <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #374151', color: '#9ca3af' }}>
            <th style={{ padding: '12px' }}>Nom</th>
            <th style={{ padding: '12px' }}>Catégorie</th>
            <th style={{ padding: '12px' }}>Volume Unitaire</th>
            {/* 🔒 COLONNE PRIX D'ACHAT : ADMIN SEULEMENT */}
            {role === 'admin' && <th style={{ padding: '12px' }}>Prix d'Achat HT</th>}
            {role === 'admin' && <th style={{ padding: '12px' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {ingredients.map((ing) => (
            <tr key={ing.id} style={{ borderBottom: '1px solid #1f2937' }}>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>{ing.name}</td>
              <td style={{ padding: '12px', color: '#10b981' }}>{ing.category || 'Général'}</td>
              <td style={{ padding: '12px' }}>{ing.volume_ml} ml</td>

              {/* 🔒 PRIX D'ACHAT : ADMIN SEULEMENT */}
              {role === 'admin' && (
                <td style={{ padding: '12px', color: '#f59e0b' }}>
                  {ing.buy_price_ht ? `${ing.buy_price_ht} €` : '-'}
                </td>
              )}

              {/* 🔒 ACTIONS : ADMIN SEULEMENT */}
              {role === 'admin' && (
                <td style={{ padding: '12px' }}>
                  <button
                    onClick={() => handleDelete(ing.id)}
                    style={{
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Supprimer
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}