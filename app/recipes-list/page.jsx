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
    setLoading(true);
    // Récupère les recettes et leurs ingrédients liés
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        recipe_ingredients (
          quantity_ml,
          ingredients (
            cost_ht,
            volume_ml
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors du chargement des recettes:', error);
    } else {
      // Calcul du coût total pour chaque recette
      const formattedRecipes = data.map((recipe) => {
        const totalCost = recipe.recipe_ingredients.reduce((acc, item) => {
          const ing = item.ingredients;
          if (!ing || !ing.volume_ml) return acc;
          const costPerMl = ing.cost_ht / ing.volume_ml;
          return acc + costPerMl * item.quantity_ml;
        }, 0);

        const marginEur = recipe.price_ht - totalCost;
        const marginPercent = recipe.price_ht > 0 
          ? ((marginEur / recipe.price_ht) * 100).toFixed(1) 
          : 0;

        return {
          ...recipe,
          totalCost: totalCost.toFixed(2),
          marginEur: marginEur.toFixed(2),
          marginPercent: marginPercent,
        };
      });

      setRecipes(formattedRecipes);
    }
    setLoading(false);
  };

  const deleteRecipe = async (id) => {
    if (confirm('Es-tu sûr de vouloir supprimer cette recette ?')) {
      const { error } = await supabase.from('recipes').delete().eq('id', id);
      if (!error) {
        setRecipes(recipes.filter((r) => r.id !== id));
      } else {
        alert('Erreur lors de la suppression : ' + error.message);
      }
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>📜 Carte des Cocktails & Recettes</h1>

      {loading ? (
        <p>Chargement des recettes...</p>
      ) : recipes.length === 0 ? (
        <p>Aucune recette enregistrée pour le moment.</p>
      ) : (
        <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              style={{
                border: '1px solid #e4e4e7',
                borderRadius: '8px',
                padding: '20px',
                background: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h2 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>{recipe.name}</h2>
                <div style={{ display: 'flex', gap: '20px', color: '#52525b', fontSize: '14px' }}>
                  <span>Coût d'achat : <strong>{recipe.totalCost} €</strong></span>
                  <span>Prix de vente HT : <strong>{recipe.price_ht} €</strong></span>
                  <span>
                    Marge :{' '}
                    <strong style={{ color: recipe.marginPercent >= 70 ? '#16a34a' : '#d97706' }}>
                      {recipe.marginEur} € ({recipe.marginPercent} %)
                    </strong>
                  </span>
                </div>
              </div>

              <button
                onClick={() => deleteRecipe(recipe.id)}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}