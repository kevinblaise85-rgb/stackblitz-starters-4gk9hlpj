'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

export default function EditRecipePage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [ingredientsList, setIngredientsList] = useState([]);
  const [recipeName, setRecipeName] = useState('');
  const [recipePrice, setRecipePrice] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipeId = searchParams.get('id');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setAuthLoading(false);
        fetchIngredients();
        if (recipeId) {
          fetchRecipeDetails(recipeId);
        }
      }
    };
    checkAuth();
  }, [router, recipeId]);

  const fetchIngredients = async () => {
    const { data } = await supabase.from('ingredients').select('*').order('name', { ascending: true });
    setIngredientsList(data || []);
  };

  const fetchRecipeDetails = async (id) => {
    // 1. Charger la recette
    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (recipeError) {
      console.error('Erreur chargement recette:', recipeError.message);
      return;
    }

    setRecipeName(recipeData.name);
    setRecipePrice(recipeData.selling_price_ttc || recipeData.price || '');

    // 2. Charger les ingrédients liés à la recette
    const { data: linkData, error: linkError } = await supabase
      .from('recipe_ingredients')
      .select('*')
      .eq('recipe_id', id);

    if (!linkError && linkData) {
      setSelectedIngredients(
        linkData.map((item) => ({
          ingredient_id: item.ingredient_id,
          quantity_ml: item.quantity_ml,
        }))
      );
    }
  };

  const addIngredientRow = () => {
    setSelectedIngredients([...selectedIngredients, { ingredient_id: '', quantity_ml: '' }]);
  };

  const handleIngredientChange = (index, field, value) => {
    const updated = [...selectedIngredients];
    updated[index][field] = value;
    setSelectedIngredients(updated);
  };

  const removeIngredientRow = (index) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  // Calculs en temps réel
  const calculateTotalCost = () => {
    return selectedIngredients.reduce((total, item) => {
      const ing = ingredientsList.find((i) => i.id === item.ingredient_id);
      if (!ing || !item.quantity_ml || !ing.volume_ml) return total;
      const costPerMl = ing.cost_ht / ing.volume_ml;
      return total + costPerMl * parseFloat(item.quantity_ml);
    }, 0);
  };

  const totalCost = calculateTotalCost();
  const sellingPrice = parseFloat(recipePrice) || 0;
  const margin = sellingPrice > 0 ? sellingPrice - totalCost : 0;
  const costRatio = sellingPrice > 0 ? (totalCost / sellingPrice) * 100 : 0;

  // Sauvegarder les modifications
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!recipeName) {
      alert('Veuillez donner un nom au cocktail !');
      return;
    }

    setLoading(true);

    // 1. Mettre à jour la recette
    const { error: updateError } = await supabase
      .from('recipes')
      .update({
        name: recipeName,
        selling_price_ttc: recipePrice ? parseFloat(recipePrice) : 0,
      })
      .eq('id', recipeId);

    if (updateError) {
      alert('Erreur lors de la mise à jour : ' + updateError.message);
      setLoading(false);
      return;
    }

    // 2. Supprimer les anciennes associations d'ingrédients
    await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId);

    // 3. Insérer les nouvelles associations
    if (selectedIngredients.length > 0) {
      const recipeIngredientsData = selectedIngredients
        .filter((item) => item.ingredient_id && item.quantity_ml)
        .map((item) => ({
          recipe_id: recipeId,
          ingredient_id: item.ingredient_id,
          quantity_ml: parseFloat(item.quantity_ml),
        }));

      if (recipeIngredientsData.length > 0) {
        await supabase.from('recipe_ingredients').insert(recipeIngredientsData);
      }
    }

    setLoading(false);
    alert('Recette modifiée avec succès !');
    router.push('/recipes-list');
  };

  if (authLoading) {
    return (
      <main style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <p>Chargement...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>✏️ Modifier le Cocktail</h2>

      <form onSubmit={handleUpdate} style={{ background: '#f4f4f5', padding: '20px', borderRadius: '8px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Nom du cocktail :</label>
          <input
            type="text"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Prix de vente (€) :</label>
          <input
            type="number"
            step="0.10"
            value={recipePrice}
            onChange={(e) => setRecipePrice(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <h3>Composition</h3>
        {selectedIngredients.map((item, index) => {
          const ing = ingredientsList.find((i) => i.id === item.ingredient_id);
          const lineCost = ing && item.quantity_ml && ing.volume_ml
            ? ((ing.cost_ht / ing.volume_ml) * parseFloat(item.quantity_ml)).toFixed(2)
            : '0.00';

          return (
            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
              <select
                value={item.ingredient_id}
                onChange={(e) => handleIngredientChange(index, 'ingredient_id', e.target.value)}
                style={{ flex: 2, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">Sélectionner un ingrédient</option>
                {ingredientsList.map((i) => (
                  <option key={i.id} value={i.id}>{i.name} ({i.category})</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="ml"
                value={item.quantity_ml}
                onChange={(e) => handleIngredientChange(index, 'quantity_ml', e.target.value)}
                style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />

              <span style={{ minWidth: '65px', fontWeight: 'bold', color: '#4b5563' }}>{lineCost} €</span>

              <button
                type="button"
                onClick={() => removeIngredientRow(index)}
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 12px', borderRadius: '4px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addIngredientRow}
          style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px', display: 'block' }}
        >
          + Ajouter un ingrédient
        </button>

        <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#0369a1' }}>📊 Indicateurs Financiers</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>Coût de revient : <strong>{totalCost.toFixed(2)} €</strong></div>
            <div>Marge brute : <strong style={{ color: '#059669' }}>{margin.toFixed(2)} €</strong></div>
            <div>Ratio : <strong style={{ color: costRatio > 30 ? '#dc2626' : '#059669' }}>{costRatio.toFixed(1)} %</strong></div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', background: '#10b981', color: '#fff', border: 'none', padding: '12px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
        >
          {loading ? 'Enregistrement...' : '💾 Enregistrer les modifications'}
        </button>
      </form>
    </main>
  );
}