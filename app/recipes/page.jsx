'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function CreateRecipePage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [ingredientsList, setIngredientsList] = useState([]);
  const [recipeName, setRecipeName] = useState('');
  const [recipePrice, setRecipePrice] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState([]);
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
        fetchIngredients();
      }
    };

    checkAuth();
  }, [router]);

  const fetchIngredients = async () => {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Erreur de chargement des ingrédients:', error.message);
    } else {
      setIngredientsList(data || []);
    }
  };

  const addIngredientRow = () => {
    setSelectedIngredients([
      ...selectedIngredients,
      { ingredient_id: '', quantity_ml: '' },
    ]);
  };

  const handleIngredientChange = (index, field, value) => {
    const updated = [...selectedIngredients];
    updated[index][field] = value;
    setSelectedIngredients(updated);
  };

  const removeIngredientRow = (index) => {
    const updated = selectedIngredients.filter((_, i) => i !== index);
    setSelectedIngredients(updated);
  };

  // --- CALCULS AUTOMATIQUES EN TEMPS RÉEL ---
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

  // --- SAUVEGARDER LA RECETTE ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recipeName) {
      alert('Veuillez donner un nom à votre cocktail !');
      return;
    }

    setLoading(true);

    // 1. Création de la recette avec la clé exacte selling_price_ttc de Supabase
    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .insert([
        {
          name: recipeName,
          selling_price_ttc: recipePrice ? parseFloat(recipePrice) : 0,
        },
      ])
      .select();

    if (recipeError) {
      alert('Erreur lors de la création de la recette : ' + recipeError.message);
      setLoading(false);
      return;
    }

    const createdRecipe = recipeData[0];

    // 2. Insertion des ingrédients dans la table de liaison recipe_ingredients (si elle existe)
    if (selectedIngredients.length > 0 && createdRecipe) {
      const recipeIngredientsData = selectedIngredients
        .filter((item) => item.ingredient_id && item.quantity_ml)
        .map((item) => ({
          recipe_id: createdRecipe.id,
          ingredient_id: item.ingredient_id,
          quantity_ml: parseFloat(item.quantity_ml),
        }));

      if (recipeIngredientsData.length > 0) {
        const { error: linkError } = await supabase
          .from('recipe_ingredients')
          .insert(recipeIngredientsData);

        if (linkError) {
          console.error('Erreur liaison ingrédients:', linkError.message);
        }
      }
    }

    setRecipeName('');
    setRecipePrice('');
    setSelectedIngredients([]);
    setLoading(false);

    alert('Cocktail enregistré avec succès !');
    router.push('/recipes-list');
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
      <h2>🍹 Créer un nouveau Cocktail</h2>

      <form
        onSubmit={handleSubmit}
        style={{
          background: '#f4f4f5',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
            Nom du cocktail :
          </label>
          <input
            type="text"
            placeholder="ex: Mojito, Espresso Martini..."
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
            Prix de vente HT ou TTC (€) :
          </label>
          <input
            type="number"
            step="0.10"
            placeholder="ex: 12.00"
            value={recipePrice}
            onChange={(e) => setRecipePrice(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          />
        </div>

        <h3>Composition du cocktail</h3>

        {selectedIngredients.map((item, index) => {
          const ing = ingredientsList.find((i) => i.id === item.ingredient_id);
          const lineCost =
            ing && item.quantity_ml && ing.volume_ml
              ? ((ing.cost_ht / ing.volume_ml) * parseFloat(item.quantity_ml)).toFixed(2)
              : '0.00';

          return (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '10px',
                alignItems: 'center',
              }}
            >
              <select
                value={item.ingredient_id}
                onChange={(e) =>
                  handleIngredientChange(index, 'ingredient_id', e.target.value)
                }
                style={{
                  flex: 2,
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                }}
              >
                <option value="">Sélectionner un ingrédient</option>
                {ingredientsList.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.category})
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Dosage (ml)"
                value={item.quantity_ml}
                onChange={(e) =>
                  handleIngredientChange(index, 'quantity_ml', e.target.value)
                }
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                }}
              />

              <span
                style={{
                  minWidth: '65px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#4b5563',
                }}
              >
                {lineCost} €
              </span>

              <button
                type="button"
                onClick={() => removeIngredientRow(index)}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addIngredientRow}
          style={{
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            padding: '8px 15px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginBottom: '20px',
            display: 'block',
          }}
        >
          + Ajouter un ingrédient
        </button>

        {/* CADRE DE RÉSUMÉ FINANCIER EN TEMPS RÉEL */}
        <div
          style={{
            background: '#e0f2fe',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
          }}
        >
          <h4 style={{ margin: '0 0 10px 0', color: '#0369a1' }}>
            📊 Indicateurs Financiers
          </h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '13px', color: '#0284c7' }}>Coût de revient :</span>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0369a1' }}>
                {totalCost.toFixed(2)} €
              </div>
            </div>
            <div>
              <span style={{ fontSize: '13px', color: '#0284c7' }}>Marge brute :</span>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>
                {margin.toFixed(2)} €
              </div>
            </div>
            <div>
              <span style={{ fontSize: '13px', color: '#0284c7' }}>Ratio Coût / Prix :</span>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: costRatio > 30 ? '#dc2626' : '#059669',
                }}
              >
                {costRatio.toFixed(1)} %
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            background: '#10b981',
            color: '#fff',
            border: 'none',
            padding: '12px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
          }}
        >
          {loading ? 'Enregistrement...' : '💾 Enregistrer le cocktail'}
        </button>
      </form>
    </main>
  );
}