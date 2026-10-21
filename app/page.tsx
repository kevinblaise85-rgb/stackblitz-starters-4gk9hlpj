'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function RecipesListPage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const { data: recData, error } = await supabase.from('recipes').select('*').order('name');
      if (error) throw error;

      if (recData) {
        const fullRecipes = await Promise.all(
          recData.map(async (recipe) => {
            const { data: items } = await supabase
              .from('recipe_items')
              .select('quantity, item_type, ingredients(name, buy_price_ht, volume_ml), preparations(name)')
              .eq('recipe_id', recipe.id);

            return {
              ...recipe,
              items: items || [],
            };
          })
        );
        setRecipes(fullRecipes);
      }
    } catch (err) {
      console.error('Erreur chargement liste recettes:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipes = recipes.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📋 Catalogue des Cocktails</h2>
        
        <input
          type="text"
          placeholder="Rechercher un cocktail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            background: '#27272a',
            border: '1px solid #374151',
            color: '#fff',
            width: '250px',
          }}
        />
      </div>

      {loading ? (
        <p>Chargement du catalogue...</p>
      ) : filteredRecipes.length === 0 ? (
        <p style={{ color: '#9ca3af' }}>Aucune recette trouvée.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filteredRecipes.map((recipe) => {
            const totalCost = recipe.items?.reduce((sum, item) => {
              if (item.item_type === 'ingredient' && item.ingredients) {
                const costPerMl = item.ingredients.volume_ml > 0 ? item.ingredients.buy_price_ht / item.ingredients.volume_ml : 0;
                return sum + costPerMl * item.quantity;
              }
              return sum + 0.02 * item.quantity; // Estimation par défaut pour les prép. maison
            }, 0) || 0;

            const marginRatio = totalCost > 0 ? (recipe.sale_price_ttc / totalCost).toFixed(1) : 0;
            const grossMargin = (recipe.sale_price_ttc - totalCost).toFixed(2);

            return (
              <div
                key={recipe.id}
                style={{
                  background: '#18181b',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #374151',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 2 }}>
                  <h3 style={{ margin: '0 0 5px 0', color: '#10b981', fontSize: '18px' }}>{recipe.name}</h3>
                  <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                    {recipe.items?.map((it, idx) => (
                      <span key={idx}>
                        {idx > 0 ? ' • ' : ''}
                        {it.item_type === 'ingredient' ? it.ingredients?.name : it.preparations?.name} ({it.quantity}ml)
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', textAlign: 'right', flex: 1.5, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <div style={{ fontSize: '13px' }}>
                    <div style={{ color: '#9ca3af' }}>Coût : {totalCost.toFixed(2)} €</div>
                    <div style={{ color: '#10b981', fontWeight: 'bold' }}>Marge : +{grossMargin} €</div>
                  </div>

                  <div style={{ background: '#111827', padding: '10px 15px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>{recipe.sale_price_ttc} €</div>
                    <div style={{ fontSize: '11px', color: '#10b981' }}>Coeff. x{marginRatio}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}