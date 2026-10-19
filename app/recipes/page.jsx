'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function RecipeBuilderPage() {
  const [ingredientsList, setIngredientsList] = useState([]);
  const [saving, setSaving] = useState(false);
  
  // Infos du cocktail
  const [recipeName, setRecipeName] = useState('');
  const [sellingPriceTtc, setSellingPriceTtc] = useState('12.00');
  const [vatRate, setVatRate] = useState('20');

  // Doses du cocktail [{ ingredient_id, name, cost_per_ml, quantity_ml }]
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  // 1. Charger les ingrédients disponibles
  useEffect(() => {
    async function loadIngredients() {
      const { data, error } = await supabase.from('ingredients').select('*');
      if (!error) setIngredientsList(data || []);
    }
    loadIngredients();
  }, []);

  // Ajouter une ligne d'ingrédient à la recette
  const addIngredientLine = () => {
    if (ingredientsList.length === 0) return alert('Ajoutez d’abord des ingrédients dans l’inventaire !');
    const defaultIng = ingredientsList[0];
    const costPerMl = defaultIng.cost_ht / defaultIng.volume_ml;
    
    setSelectedIngredients([
      ...selectedIngredients,
      {
        ingredient_id: defaultIng.id,
        name: defaultIng.name,
        cost_per_ml: costPerMl,
        quantity_ml: 50, // Dose par défaut (5 cl)
      },
    ]);
  };

  // Mettre à jour une ligne
  const updateIngredientLine = (index, field, value) => {
    const updated = [...selectedIngredients];
    if (field === 'ingredient_id') {
      const ing = ingredientsList.find((i) => i.id === value);
      updated[index].ingredient_id = ing.id;
      updated[index].name = ing.name;
      updated[index].cost_per_ml = ing.cost_ht / ing.volume_ml;
    } else if (field === 'quantity_ml') {
      updated[index].quantity_ml = parseFloat(value) || 0;
    }
    setSelectedIngredients(updated);
  };

  // Supprimer une ligne
  const removeIngredientLine = (index) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  // --- CALCULS DE RENTABILITÉ EN TEMPS RÉEL ---
  const totalCostHt = selectedIngredients.reduce(
    (sum, item) => sum + item.cost_per_ml * item.quantity_ml,
    0
  );

  const priceTtc = parseFloat(sellingPriceTtc) || 0;
  const vat = parseFloat(vatRate) || 0;
  const priceHt = priceTtc / (1 + vat / 100);

  const costRatio = priceHt > 0 ? (totalCostHt / priceHt) * 100 : 0;
  const grossMargin = priceHt - totalCostHt;

  const getBadgeColor = () => {
    if (costRatio === 0) return '#6b7280';
    if (costRatio <= 18) return '#10b981';
    if (costRatio <= 23) return '#f59e0b';
    return '#ef4444';
  };

  // --- SAUVEGARDE DANS SUPABASE ---
  const handleSaveRecipe = async () => {
    if (!recipeName) return alert('Veuillez donner un nom à votre cocktail !');
    if (selectedIngredients.length === 0) return alert('Ajoutez au moins un ingrédient !');

    setSaving(true);

    // Étape 1 : Enregistrer le cocktail principal
    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .insert([
        {
          name: recipeName,
          selling_price_ttc: parseFloat(sellingPriceTtc),
          vat_rate: parseFloat(vatRate),
        },
      ])
      .select()
      .single();

    if (recipeError) {
      setSaving(false);
      alert('Erreur lors de la sauvegarde : ' + recipeError.message);
      return;
    }

    // Étape 2 : Enregistrer les ingrédients de la recette
    const recipeIngredientsToInsert = selectedIngredients.map((item) => ({
      recipe_id: recipeData.id,
      ingredient_id: item.ingredient_id,
      quantity_ml: item.quantity_ml,
    }));

    const { error: ingredientsError } = await supabase
      .from('recipe_ingredients')
      .insert(recipeIngredientsToInsert);

    setSaving(false);

    if (ingredientsError) {
      alert('Erreur lors de l’enregistrement des doses : ' + ingredientsError.message);
    } else {
      alert('🍹 Recette enregistrée avec succès !');
      // Réinitialiser le formulaire
      setRecipeName('');
      setSelectedIngredients([]);
    }
  };

  return (
    <main style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>🍹 BarCodex - Créateur de Recette & Calcul de Marge</h1>

      <div style={{ background: '#f4f4f5', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>1. Informations sur le Cocktail</h3>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontWeight: 'bold' }}>Nom du Cocktail :</label>
          <input 
            type="text" 
            placeholder="ex: Passion Gin Fizz" 
            value={recipeName} 
            onChange={(e) => setRecipeName(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 'bold' }}>Prix de vente TTC (€) :</label>
            <input 
              type="number" 
              step="0.50" 
              value={sellingPriceTtc} 
              onChange={(e) => setSellingPriceTtc(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 'bold' }}>Taux de TVA (%) :</label>
            <input 
              type="number" 
              value={vatRate} 
              onChange={(e) => setVatRate(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            />
          </div>
        </div>
      </div>

      {/* COMPOSITION DU COCKTAIL */}
      <div style={{ background: '#fff', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>2. Composition & Doses</h3>
        {selectedIngredients.map((line, index) => (
          <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
            <select 
              value={line.ingredient_id} 
              onChange={(e) => updateIngredientLine(index, 'ingredient_id', e.target.value)}
              style={{ flex: 2, padding: '8px' }}
            >
              {ingredientsList.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} ({ing.cost_ht}€ / {ing.volume_ml}ml)
                </option>
              ))}
            </select>

            <input 
              type="number" 
              placeholder="Dose (ml)" 
              value={line.quantity_ml} 
              onChange={(e) => updateIngredientLine(index, 'quantity_ml', e.target.value)}
              style={{ flex: 1, padding: '8px' }}
            />
            <span>ml</span>

            <span style={{ fontWeight: 'bold', width: '80px', textAlign: 'right' }}>
              {(line.cost_per_ml * line.quantity_ml).toFixed(2)} €
            </span>

            <button 
              onClick={() => removeIngredientLine(index)} 
              style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        ))}

        <button 
          onClick={addIngredientLine} 
          style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}
        >
          + Ajouter un ingrédient
        </button>
      </div>

      {/* RÉSULTAT ET RENTABILITÉ */}
      <div style={{ background: '#18181b', color: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>3. Analyse de Rentabilité</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span>Coût matière (HT) :</span>
          <strong>{totalCostHt.toFixed(2)} €</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span>Prix de vente HT :</span>
          <span>{priceHt.toFixed(2)} €</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span>Marge brute par verre :</span>
          <strong style={{ color: '#10b981' }}>{grossMargin.toFixed(2)} €</strong>
        </div>
        <hr style={{ borderColor: '#3f3f46', margin: '15px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Ratio Coût Matière :</span>
          <span style={{ background: getBadgeColor(), color: '#fff', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '18px' }}>
            {costRatio.toFixed(1)} %
          </span>
        </div>
      </div>

      {/* BOUTON ENREGISTRER */}
      <button
        onClick={handleSaveRecipe}
        disabled={saving}
        style={{ width: '100%', background: '#10b981', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
      >
        {saving ? 'Enregistrement en cours...' : '💾 Enregistrer la recette'}
      </button>
    </main>
  );
}