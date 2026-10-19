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
        fetchIngredients();
      }
    };

    checkAuth();
  }, [router]);

  // 2. Charger les ingrédients disponibles pour composer le cocktail
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

  // 3. Ajouter une ligne d'ingrédient à la recette
  const addIngredientRow = () => {
    setSelectedIngredients([
      ...selectedIngredients,
      { ingredient_id: '', quantity_ml: '' },
    ]);
  };

  // 4. Mettre à jour une ligne d'ingrédient
  const handleIngredientChange = (index, field, value) => {
    const updated = [...selectedIngredients];
    updated[index][field] = value;
    setSelectedIngredients(updated);
  };

  // 5. Supprimer une ligne d'ingrédient
  const removeIngredientRow = (index) => {
    const updated = selectedIngredients.filter((_, i) => i !== index);
    setSelectedIngredients(updated);
  };

  // 6. Sauvegarder la recette
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recipeName) {
      alert('Veuillez donner un nom à votre cocktail !');
      return;
    }

    setLoading(true);

    // Création de la recette
    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .insert([
        {
          name: recipeName,
          price: recipePrice ? parseFloat(recipePrice) : null,
        },
      ])
      .select();

    if (recipeError) {
      alert('Erreur lors de la création de la recette : ' + recipeError.message);
      setLoading(false);
      return;
    }

    // Réinitialisation du formulaire
    setRecipeName('');
    setRecipePrice('');
    setSelectedIngredients([]);
    setLoading(false);

    alert('Cocktail enregistré avec succès !');
    router.push('/recipes-list');
  };

  // 7. Déconnexion
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
            Prix de vente conseillé (€) :
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

        {selectedIngredients.map((item, index) => (
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
              {ingredientsList.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name} ({ing.category})
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
        ))}

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