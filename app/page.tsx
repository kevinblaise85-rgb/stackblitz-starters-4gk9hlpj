'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
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
        fetchData();
      }
    };

    checkAuth();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);

    // Charger les recettes, ingrédients et liens en parallèle
    const [recipesRes, ingredientsRes, linkRes] = await Promise.all([
      supabase.from('recipes').select('*'),
      supabase.from('ingredients').select('*'),
      supabase.from('recipe_ingredients').select('*'),
    ]);

    if (recipesRes.error) console.error(recipesRes.error.message);
    if (ingredientsRes.error) console.error(ingredientsRes.error.message);
    if (linkRes.error) console.error(linkRes.error.message);

    setRecipes(recipesRes.data || []);
    setIngredients(ingredientsRes.data || []);
    setRecipeIngredients(linkRes.data || []);
    setLoading(false);
  };

  if (authLoading) {
    return (
      <main style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <p>Vérification de l'accès en cours...</p>
      </main>
    );
  }

  // --- CALCUL DES STATISTIQUES FINANCIÈRES ---
  const ingredientsMap = new Map(ingredients.map((i) => [i.id, i]));

  const enrichedRecipes = recipes.map((recipe) => {
    const price = Number(recipe.selling_price_ttc || recipe.price || 0);

    // Trouver les ingrédients de ce cocktail
    const links = recipeIngredients.filter((ri) => ri.recipe_id === recipe.id);

    // Calculer le coût de revient total
    const cost = links.reduce((sum, link) => {
      const ing = ingredientsMap.get(link.ingredient_id);
      if (!ing || !ing.volume_ml || !link.quantity_ml) return sum;
      return sum + (ing.cost_ht / ing.volume_ml) * link.quantity_ml;
    }, 0);

    const margin = price > 0 ? price - cost : 0;
    const ratio = price > 0 ? (cost / price) * 100 : 0;

    return {
      ...recipe,
      price,
      cost,
      margin,
      ratio,
    };
  });

  // Indicateurs globaux
  const totalRecipes = enrichedRecipes.length;
  const validRecipes = enrichedRecipes.filter((r) => r.price > 0);

  const avgMargin =
    validRecipes.length > 0
      ? validRecipes.reduce((sum, r) => sum + r.margin, 0) / validRecipes.length
      : 0;

  const avgRatio =
    validRecipes.length > 0
      ? validRecipes.reduce((sum, r) => sum + r.ratio, 0) / validRecipes.length
      : 0;

  // Cocktails à surveiller (Ratio > 25%)
  const warningRecipes = enrichedRecipes.filter((r) => r.ratio > 25);

  // Top 3 des cocktails les plus rentables (par marge €)
  const topProfitable = [...enrichedRecipes]
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 3);

  return (
    <main
      style={{
        padding: '20px',
        maxWidth: '900px',
        margin: '0 auto',
        fontFamily: 'sans-serif',
      }}
    >
      <h2>📊 Tableau de bord financier</h2>

      {loading ? (
        <p>Analyse des données financières...</p>
      ) : (
        <>
          {/* CARTES DE RÉSUMÉ KPI */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                background: '#f4f4f5',
                padding: '20px',
                borderRadius: '8px',
                borderLeft: '5px solid #3b82f6',
              }}
            >
              <span style={{ fontSize: '13px', color: '#666' }}>Cocktails à la carte</span>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px' }}>
                {totalRecipes}
              </div>
            </div>

            <div
              style={{
                background: '#f4f4f5',
                padding: '20px',
                borderRadius: '8px',
                borderLeft: '5px solid #10b981',
              }}
            >
              <span style={{ fontSize: '13px', color: '#666' }}>Marge moyenne / verre</span>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px', color: '#059669' }}>
                {avgMargin.toFixed(2)} €
              </div>
            </div>

            <div
              style={{
                background: '#f4f4f5',
                padding: '20px',
                borderRadius: '8px',
                borderLeft: `5px solid ${avgRatio > 25 ? '#ef4444' : '#10b981'}`,
              }}
            >
              <span style={{ fontSize: '13px', color: '#666' }}>Ratio Coût moyen</span>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginTop: '5px',
                  color: avgRatio > 25 ? '#dc2626' : '#059669',
                }}
              >
                {avgRatio.toFixed(1)} %
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '20px',
            }}
          >
            {/* TOP 3 PLUS RENTABLES */}
            <div
              style={{
                background: '#fff',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e4e4e7',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              }}
            >
              <h3 style={{ margin: '0 0 15px 0', color: '#059669', fontSize: '16px' }}>
                🏆 Top 3 des cocktails les plus rentables
              </h3>
              {topProfitable.length === 0 ? (
                <p style={{ color: '#666', fontSize: '14px' }}>Aucune donnée disponible.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {topProfitable.map((r, index) => (
                    <div
                      key={r.id}
                      style={{
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center',
                        padding: '10px',
                        background: '#f0fdf4',
                        borderRadius: '6px',
                        border: '1px solid #bbf7d0',
                      }}
                    >
                      <div>
                        <strong>
                          #{index + 1} {r.name}
                        </strong>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Prix: {r.price.toFixed(2)} € | Coût: {r.cost.toFixed(2)} €
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 'bold', color: '#059669' }}>
                          +{r.margin.toFixed(2)} €
                        </span>
                        <div style={{ fontSize: '12px', color: '#666' }}>{r.ratio.toFixed(1)}% ratio</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ALERTES RATIO ÉLEVÉ */}
            <div
              style={{
                background: '#fff',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e4e4e7',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              }}
            >
              <h3 style={{ margin: '0 0 15px 0', color: '#dc2626', fontSize: '16px' }}>
                ⚠️ Cocktails à réajuster (Ratio &gt; 25%)
              </h3>
              {warningRecipes.length === 0 ? (
                <p style={{ color: '#059669', fontSize: '14px' }}>
                  ✅ Tous vos cocktails ont un ratio coût/prix optimal !
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {warningRecipes.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center',
                        padding: '10px',
                        background: '#fef2f2',
                        borderRadius: '6px',
                        border: '1px solid #fecaca',
                      }}
                    >
                      <div>
                        <strong>{r.name}</strong>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Marge: {r.margin.toFixed(2)} €
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 'bold', color: '#dc2626' }}>
                          {r.ratio.toFixed(1)} %
                        </span>
                        <div>
                          <Link
                            href={`/recipes/edit?id=${r.id}`}
                            style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'underline' }}
                          >
                            Réajuster
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}