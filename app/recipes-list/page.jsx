'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RecipesListPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
      } else {
        setAuthLoading(false);
        fetchRecipes();
      }
    };

    checkAuth();
  }, [router]);

  const fetchRecipes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors du chargement des recettes:', error.message);
    } else {
      setRecipes(data || []);
    }
    setLoading(false);
  };

  // Fonction pour supprimer une recette
  const handleDelete = async (id, name) => {
    if (!confirm(`Es-tu sûr de vouloir supprimer le cocktail "${name}" ?`)) {
      return;
    }

    const { error } = await supabase.from('recipes').delete().eq('id', id);

    if (error) {
      alert('Erreur lors de la suppression : ' + error.message);
    } else {
      setRecipes(recipes.filter((recipe) => recipe.id !== id));
    }
  };

  if (authLoading) {
    return (
      <main style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <p>Vérification de l'accès en cours...</p>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'sans-serif',
      }}
    >
      <h2>📜 Mes Recettes & Cocktails ({recipes.length})</h2>

      {loading ? (
        <p>Chargement des recettes...</p>
      ) : recipes.length === 0 ? (
        <p style={{ color: '#666', fontStyle: 'italic' }}>
          Aucune recette enregistrée pour le moment.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {recipes.map((recipe) => {
            const price = Number(recipe.selling_price_ttc || recipe.price || 0);

            return (
              <div
                key={recipe.id}
                style={{
                  background: '#fff',
                  padding: '15px 20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  border: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>🍹 {recipe.name}</h3>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#059669',
                    }}
                  >
                    {price > 0 ? `Prix : ${price.toFixed(2)} €` : 'Prix non défini'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link
                    href={`/recipes/edit?id=${recipe.id}`}
                    style={{
                      background: '#3b82f6',
                      color: '#fff',
                      padding: '8px 12px',
                      borderRadius: '5px',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                  >
                    ✏️ Modifier
                  </Link>
                  <button
                    onClick={() => handleDelete(recipe.id, recipe.name)}
                    style={{
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}