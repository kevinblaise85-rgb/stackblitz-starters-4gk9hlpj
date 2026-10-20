'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function CreateRecipePage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [ingredientsList, setIngredientsList] = useState([]);
  const [recipeName, setRecipeName] = useState('');
  const [recipePrice, setRecipePrice] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState([
    { ingredient_id: '', quantity_ml: '' },
  ]);
  const [formats, setFormats] = useState([
    { name: 'Shooter (4 cl)', factor: 0.4, price: 3.5 },
    { name: 'Verre Standard', factor: 1.0, price: 9.0 },
    { name: 'Format XXL', factor: 2.0, price: 16.0 },
  ]);
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
    const { data } = await supabase
      .from('ingredients')
      .select('*')
      .order('name', { ascending: true });
    setIngredientsList(data || []);
  };

  // Gestion des lignes d'ingrédients
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
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  // Gestion des formats / déclinaisons de verres
  const handleFormatChange = (index, field, value) => {
    const updated = [...formats];
    updated[index][field] = value;
    setFormats(updated);
  };

  const addFormatRow = () => {
    setFormats([...formats, { name: 'Nouveau Format', factor: 1.0, price: 0 }]);
  };

  const removeFormatRow = (index) => {
    setFormats(formats.filter((_, i) => i !== index));
  };

  // Calculs financiers en temps réel
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

  // Création de la recette dans Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recipeName) {
      alert('Veuillez donner un nom au cocktail !');
      return;
    }

    setLoading(true);

    // 1. Créer la recette de base
    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .insert([
        {
          name: recipeName,
          selling_price_ttc: recipePrice ? parseFloat(recipePrice) : 0,
        },
      ])
      .select()
      .single();

    if (recipeError) {
      alert("Erreur lors de la création : " + recipeError.message);
      setLoading(false);
      return;
    }

    // 2. Insérer la composition des ingrédients
    if (selectedIngredients.length > 0 && recipeData) {
      const recipeIngredientsData = selectedIngredients
        .filter((item) => item.ingredient_id && item.quantity_ml)
        .map((item) => ({
          recipe_id: recipeData.id,
          ingredient_id: item.ingredient_id,
          quantity_ml: parseFloat(item.quantity_ml),
        }));

      if (recipeIngredientsData.length > 0) {
        await supabase
          .from('recipe_ingredients')
          .insert(recipeIngredientsData);
      }
    }

    setLoading(false);
    alert('Cocktail créé avec succès !');
    router.push('/recipes-list');
  };

  if (authLoading) {
    return (
      <main
        style={{
          padding: '40px',
          textAlign: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <p>Vérification de l'accès en cours...</p>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: '20px',
        maxWidth: '850px',
        margin: '0 auto',
        fontFamily: 'sans-serif',
      }}
    >
      <h2>📝 Créer une nouvelle Recette / Cocktail</h2>

      <form
        onSubmit={handleSubmit}
        style={{
          background: '#f4f4f5',
          padding: '20px',
          borderRadius: '8px',
        }}
      >
        <div style={{ marginBottom: '15px' }}>
          <label
            style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}
          >
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
          <label
            style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}
          >
            Prix de vente de base (€) :
          </label>
          <input
            type="number"
            step="0.10"
            placeholder="ex: 10.00"
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

        <h3>Composition de base</h3>
        {selectedIngredients.map((item, index) => {
          const ing = ingredientsList.find((i) => i.id === item.ingredient_id);
          const lineCost =
            ing && item.quantity_ml && ing.volume_ml
              ? (
                  (ing.cost_ht / ing.volume_ml) *
                  parseFloat(item.quantity_ml)
                ).toFixed(2)
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
                placeholder="ml"
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

        {/* INDICATEURS DE BASE */}
        <div
          style={{
            background: '#e0f2fe',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '25px',
          }}
        >
          <h4 style={{ margin: '0 0 10px 0', color: '#0369a1' }}>
            📊 Indicateurs Financiers (Taille Standard)
          </h4>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              Coût de revient : <strong>{totalCost.toFixed(2)} €</strong>
            </div>
            <div>
              Marge brute :{' '}
              <strong style={{ color: '#059669' }}>
                {margin.toFixed(2)} €
              </strong>
            </div>
            <div>
              Ratio :{' '}
              <strong
                style={{ color: costRatio > 30 ? '#dc2626' : '#059669' }}
              >
                {costRatio.toFixed(1)} %
              </strong>
            </div>
          </div>
        </div>

        {/* DÉCLINAISONS / TAILLES DE VERRES */}
        <div
          style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e4e4e7',
            marginBottom: '25px',
          }}
        >
          <h3 style={{ margin: '0 0 15px 0' }}>
            🍷 Déclinaisons & Tailles de verres
          </h3>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            {formats.map((fmt, index) => {
              const fmtCost = totalCost * parseFloat(fmt.factor || 0);
              const fmtPrice = parseFloat(fmt.price || 0);
              const fmtMargin = fmtPrice > 0 ? fmtPrice - fmtCost : 0;
              const fmtRatio = fmtPrice > 0 ? (fmtCost / fmtPrice) * 100 : 0;

              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    background: '#f9fafb',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #f3f4f6',
                  }}
                >
                  <div style={{ flex: 2 }}>
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#666',
                        display: 'block',
                      }}
                    >
                      Nom du format
                    </span>
                    <input
                      type="text"
                      value={fmt.name}
                      placeholder="ex: Shooter, Pinte..."
                      onChange={(e) =>
                        handleFormatChange(index, 'name', e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                      }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#666',
                        display: 'block',
                      }}
                    >
                      Facteur dose
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      value={fmt.factor}
                      onChange={(e) =>
                        handleFormatChange(index, 'factor', e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                      }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#666',
                        display: 'block',
                      }}
                    >
                      Prix (€)
                    </span>
                    <input
                      type="number"
                      step="0.5"
                      value={fmt.price}
                      onChange={(e) =>
                        handleFormatChange(index, 'price', e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                      }}
                    />
                  </div>

                  <div style={{ flex: 2, fontSize: '13px' }}>
                    <div>
                      Coût : <strong>{fmtCost.toFixed(2)} €</strong>
                    </div>
                    <div>
                      Marge :{' '}
                      <strong style={{ color: '#059669' }}>
                        {fmtMargin.toFixed(2)} €
                      </strong>{' '}
                      ({fmtRatio.toFixed(1)}%)
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFormatRow(index)}
                    style={{
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addFormatRow}
            style={{
              marginTop: '15px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              padding: '8px 15px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            + Ajouter une déclinaison
          </button>
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
          {loading ? 'Création...' : '💾 Enregistrer la recette'}
        </button>
      </form>
    </main>
  );
}