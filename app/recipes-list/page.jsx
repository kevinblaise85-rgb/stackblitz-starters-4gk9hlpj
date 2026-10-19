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

  // 3. Déconnexion
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
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
      {/* ENTÊTE & BOUTON DÉCONNEXION */}
      <div
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h1 style={{ margin: 0 }}>🍾 BarCodex</h1>
        <button
          onClick={handleLogout}
          style={{
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            padding: '8px 15px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Déconnexion
        </button>
      </div>

      <h2>🍸 Liste des Recettes</h2>

      {loading ? (
        <p>Chargement des recettes...</p>
      ) : recipes.length === 0 ? (
        <p style={{ color: '#666', fontStyle: 'italic' }}>
          Aucune recette enregistrée pour le moment.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              style={{
                background: '#fff',
                padding: '15px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                border: '1px solid #eee',
              }}
            >
              <h3 style={{ margin: '0 0 10px 0' }}>{recipe.name}</h3>
              {recipe.description && (
                <p style={{ color: '#555', margin: '0 0 10px 0' }}>{recipe.description}</p>
              )}
              {recipe.price && (
                <p style={{ fontWeight: 'bold', color: '#059669', margin: 0 }}>
                  Prix de vente : {Number(recipe.price).toFixed(2)} €
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}