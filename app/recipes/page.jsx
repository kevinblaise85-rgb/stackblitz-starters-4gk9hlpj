'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [preparations, setPreparations] = useState([]);
  
  const [name, setName] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [recipeItems, setRecipeItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: ingData } = await supabase.from('ingredients').select('*').order('name');
      setIngredients(ingData || []);

      const { data: prepData } = await supabase.from('preparations').select('*').order('name');
      setPreparations(prepData || []);

      const { data: recData } = await supabase.from('recipes').select('*').order('name');

      if (recData) {
        const fullRecipes = await Promise.all(
          recData.map(async (recipe) => {
            const { data: items } = await supabase
              .from('recipe_items')
              .select('quantity, item_type, ingredient_id, preparation_id, ingredients(name, buy_price_ht, volume_ml), preparations(name, output_volume_ml)')
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
      console.error('Erreur chargement recettes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItemRow = () => {
    setRecipeItems([...recipeItems, { type: 'ingredient', item_id: '', quantity: '' }]);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...recipeItems];
    updated[index][field] = value;
    if (field === 'type') updated[index].item_id = '';
    setRecipeItems(updated);
  };

  const handleRemoveItemRow = (index) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };

  const handleAddRecipe = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !salePrice || recipeItems.length === 0) {
      setErrorMsg('Veuillez renseigner le nom, le prix de vente et au moins un ingrédient/préparation.');
      return;
    }

    try {
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .insert([{ name: name.trim(), sale_price_ttc: parseFloat(salePrice) }])
        .select()
        .single();

      if (recipeError) throw recipeError;

      const itemsPayload = recipeItems.map((item) => ({
        recipe_id: recipeData.id,
        item_type: item.type,
        ingredient_id: item.type === 'ingredient' ? item.item_id : null,
        preparation_id: item.type === 'preparation' ? item.item_id : null,
        quantity: parseFloat(item.quantity),
      }));

      const { error: itemsError } = await supabase.from('recipe_items').insert(itemsPayload);
      if (itemsError) throw itemsError;

      setName('');
      setSalePrice('');
      setRecipeItems([]);
      fetchData();
    } catch (err) {
      console.error('Erreur création recette:', err.message);
      setErrorMsg(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Voulez-vous supprimer cette recette ?')) return;

    try {
      await supabase.from('recipes').delete().eq('id', id);
      setRecipes(recipes.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  return (
    <main style={{ padding: '30px', maxWidth: '900px', margin: '0 auto', color: '#fff' }}>
      <h2>🍹 Création des Fiches Recettes (Cocktails)</h2>

      <form
        onSubmit={handleAddRecipe}
        style={{
          background: '#18181b',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
          border: '1px solid #374151',
        }}
      >
        <h3 style={{ marginTop: 0, fontSize: '16px', color: '#10b981' }}>Ajouter une nouvelle recette</h3>

        {errorMsg && (
          <div style={{ background: '#ef444422', color: '#ef4444', padding: '10px', borderRadius: '4px', marginBottom: '15px', border: '1px solid #ef4444', fontSize: '14px' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px' }}>Nom du cocktail</label>
            <input
              type="text"
              placeholder="ex: Mojito..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', background: '#27272a', border: '1px solid #374151', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px' }}>Prix de vente TTC (€)</label>
            <input
              type="number"
              step="0.1"
              placeholder="ex: 12.00"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', background: '#27272a', border: '1px solid #374151', color: '#fff' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Ingrédients et Dosages :</label>

          {recipeItems.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
              <select
                value={item.type}
                onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                style={{ flex: 1, padding: '8px', borderRadius: '4px', background: '#27272a', border: '1px solid #374151', color: '#fff' }}
              >
                <option value="ingredient">Ingrédient brut</option>
                <option value="preparation">Maison / Préparation</option>
              </select>

              <select
                value={item.item_id}
                onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                required
                style={{ flex: 2, padding: '8px', borderRadius: '4px', background: '#27272a', border: '1px solid #374151', color: '#fff' }}
              >
                <option value="">Sélectionner...</option>
                {item.type === 'ingredient'
                  ? ingredients.map((ing) => <option key={ing.id} value={ing.id}>{ing.name}</option>)
                  : preparations.map((prep) => <option key={prep.id} value={prep.id}>{prep.name}</option>)}
              </select>

              <input
                type="number"
                step="0.1"
                placeholder="Dose (ml)"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                required
                style={{ flex: 1, padding: '8px', borderRadius: '4px', background: '#27272a', border: '1px solid #374151', color: '#fff' }}
              />

              <button
                type="button"
                onClick={() => handleRemoveItemRow(index)}
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddItemRow}
            style={{ background: '#374151', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
          >
            + Ajouter un ingrédient / dose
          </button>
        </div>

        <button
          type="submit"
          style={{
            background: '#10b981',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Enregistrer la recette
        </button>
      </form>

      <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Vos Cocktails & Recettes</h3>

      {loading ? (
        <p>Chargement...</p>
      ) : recipes.length === 0 ? (
        <p style={{ color: '#9ca3af' }}>Aucune recette créée pour le moment.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
          {recipes.map((recipe) => {
            const totalCost = recipe.items?.reduce((sum, item) => {
              if (item.item_type === 'ingredient' && item.ingredients) {
                const costPerMl = item.ingredients.volume_ml > 0 ? item.ingredients.buy_price_ht / item.ingredients.volume_ml : 0;
                return sum + costPerMl * item.quantity;
              }
              if (item.item_type === 'preparation' && item.preparations) {
                return sum + 0.02 * item.quantity;
              }
              return sum;
            }, 0) || 0;

            const marginRatio = totalCost > 0 ? (recipe.sale_price_ttc / totalCost).toFixed(1) : 0;

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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, color: '#10b981', fontSize: '20px' }}>{recipe.name}</h4>
                    <span style={{ background: '#10b98122', color: '#10b981', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                      {recipe.sale_price_ttc} € TTC
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#d1d5db', marginBottom: '15px' }}>
                    <strong>Dosage & Ingrédients :</strong>
                    <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
                      {recipe.items?.map((it, idx) => (
                        <li key={idx}>
                          {it.item_type === 'ingredient' ? it.ingredients?.name : it.preparations?.name} : <strong>{it.quantity} ml</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <div style={{ background: '#111827', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>
                    <div>Coût de revient verre : <strong>{totalCost.toFixed(2)} €</strong></div>
                    <div>Coeff. Marge : <strong style={{ color: '#10b981' }}>x{marginRatio}</strong></div>
                  </div>

                  <button
                    onClick={() => handleDelete(recipe.id)}
                    style={{
                      width: '100%',
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '13px',
                    }}
                  >
                    Supprimer le cocktail
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