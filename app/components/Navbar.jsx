'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function RecipesListPage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const { data: recipesData } = await supabase.from('recipes').select('*');

      if (recipesData && recipesData.length > 0) {
        const fullRecipes = await Promise.all(
          recipesData.map(async (recipe) => {
            const { data: details } = await supabase
              .from('recipe_ingredients')
              .select('quantity, ingredients(name, buy_price_ht, volume_ml)')
              .eq('recipe_id', recipe.id);

            return {
              ...recipe,
              recipe_ingredients: details || [],
            };
          })
        );
        setRecipes(fullRecipes);
      } else {
        setRecipes([]);
      }
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer cette recette ?')) return;
    await supabase.from('recipes').delete().eq('id', id);
    setRecipes(recipes.filter((r) => r.id !== id));
  };

  if (loading) return <div style={{ padding: '30px', color: '#fff' }}>Chargement...</div>;

  return (
    <main style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', color: '#fff' }}>
      <h2>📜 Fiches Recettes Bar</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {recipes.map((recipe) => {
          const totalCost = recipe.recipe_ingredients?.reduce((sum, item) => {
            const ing = item.ingredients;
            if (!ing || !ing.volume_ml) return sum;
            const costPerMl = ing.buy_price_ht / ing.volume_ml;
            return sum + costPerMl * item.quantity;
          }, 0) || 0;

          const margin = recipe.selling_price_ttc ? recipe.selling_price_ttc - totalCost : 0;
          const marginRate = recipe.selling_price_ttc ? ((margin / recipe.selling_price_ttc) * 100).toFixed(1) : 0;

          return (
            <div
              key={recipe.id}
              style={{
                background: '#1f2937',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #374151',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 10px 0', color: '#10b981' }}>{recipe.name}</h3>
                <p style={{ fontSize: '14px', color: '#9ca3af' }}>Verre : {recipe.glass_type || 'Standard'}</p>

                <h4 style={{ marginTop: '15px', marginBottom: '8px', fontSize: '14px' }}>Composition :</h4>
                <ul style={{ paddingLeft: '20px', fontSize: '14px', color: '#d1d5db' }}>
                  {recipe.recipe_ingredients?.map((ri, idx) => (
                    <li key={idx}>
                      {ri.ingredients?.name || 'Ingrédient'} : <strong>{ri.quantity} ml</strong>
                    </li>
                  ))}
                </ul>

                <div
                  style={{
                    marginTop: '15px',
                    padding: '10px',
                    background: '#111827',
                    borderRadius: '6px',
                    borderLeft: '3px solid #10b981',
                    fontSize: '13px',
                  }}
                >
                  <div>Prix Vente TTC : <strong>{recipe.selling_price_ttc || 0} €</strong></div>
                  <div>Coût de revient : <strong style={{ color: '#ef4444' }}>{totalCost.toFixed(2)} €</strong></div>
                  <div>Marge brute : <strong style={{ color: '#10b981' }}>{margin.toFixed(2)} € ({marginRate}%)</strong></div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(recipe.id)}
                style={{
                  marginTop: '15px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                🗑️ Supprimer
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}