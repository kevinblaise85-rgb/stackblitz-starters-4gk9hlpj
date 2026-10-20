'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function RecipesListPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 1. Protection de la route : Vérifier la connexion utilisateur
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

  // 2. Charger la liste des recettes depuis Supabase
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
      <h2>🍸 Liste des Recettes</h2>

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
                  padding: '15px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  border: '1px solid #eee',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h3 style={{ margin: 0, fontSize: '18px' }}>🍹 {recipe.name}</h3>
                {price > 0 && (
                  <span
                    style={{
                      fontWeight: 'bold',
                      color: '#059669',
                      background: '#ecfdf5',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid #a7f3d0',
                    }}
                  >
                    {price.toFixed(2)} €
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}