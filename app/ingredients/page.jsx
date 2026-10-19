'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; // Ajuste le chemin vers ton fichier supabase.js si nécessaire

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);

  // Champs du formulaire
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Spiritueux');
  const [costHt, setCostHt] = useState('');
  const [volumeMl, setVolumeMl] = useState('700');

  // 1. Charger la liste des ingrédients depuis Supabase
  const fetchIngredients = async () => {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Erreur de chargement:', error.message);
    } else {
      setIngredients(data || []);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  // 2. Soumettre le formulaire pour ajouter un nouvel ingrédient
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !costHt || !volumeMl) {
      alert('Veuillez remplir tous les champs !');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('ingredients').insert([
      {
        name,
        category,
        cost_ht: parseFloat(costHt),
        volume_ml: parseFloat(volumeMl),
      },
    ]);

    setLoading(false);
    if (error) {
      alert('Erreur lors de l’ajout : ' + error.message);
    } else {
      // Réinitialiser le formulaire
      setName('');
      setCostHt('');
      fetchIngredients(); // Rafraîchir la liste instantanément
    }
  };

  return (
    <main
      style={{
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'sans-serif',
      }}
    >
      <h1>🍾 BarCodex - Gestion des Ingrédients</h1>

      {/* FORMULAIRE D'AJOUT */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#f4f4f5',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Ajouter une bouteille ou un ingrédient</h3>

        <div style={{ marginBottom: '12px' }}>
          <label
            style={{
              display: 'block',
              fontWeight: 'bold',
              marginBottom: '5px',
            }}
          >
            Nom de l'ingrédient :
          </label>
          <input
            type="text"
            placeholder="ex: Gin Hendrick's, Sirop de Passion..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label
            style={{
              display: 'block',
              fontWeight: 'bold',
              marginBottom: '5px',
            }}
          >
            Catégorie :
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          >
            <option value="Spiritueux">Spiritueux</option>
            <option value="Liqueur">Liqueur</option>
            <option value="Jus">Jus</option>
            <option value="Sirop">Sirop</option>
            <option value="Soft / Soda">Soft / Soda</option>
            <option value="Garniture">Garniture</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: 'block',
                fontWeight: 'bold',
                marginBottom: '5px',
              }}
            >
              Prix d'achat HT (€) :
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="ex: 28.00"
              value={costHt}
              onChange={(e) => setCostHt(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: 'block',
                fontWeight: 'bold',
                marginBottom: '5px',
              }}
            >
              Volume total (ml) :
            </label>
            <input
              type="number"
              placeholder="ex: 700"
              value={volumeMl}
              onChange={(e) => setVolumeMl(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: '#10b981',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
          }}
        >
          {loading ? 'Enregistrement...' : '+ Ajouter l’ingrédient'}
        </button>
      </form>

      {/* TABLEAU DES INGRÉDIENTS */}
      <h3>Inventaire des bouteilles ({ingredients.length})</h3>
      {ingredients.length === 0 ? (
        <p style={{ color: '#666', fontStyle: 'italic' }}>
          Aucun ingrédient enregistré pour le moment. Ajoutez votre première
          bouteille ci-dessus !
        </p>
      ) : (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: '#fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <thead>
            <tr style={{ background: '#e4e4e7', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Nom</th>
              <th style={{ padding: '12px' }}>Catégorie</th>
              <th style={{ padding: '12px' }}>Prix HT</th>
              <th style={{ padding: '12px' }}>Volume</th>
              <th style={{ padding: '12px' }}>Coût / ml</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ing) => (
              <tr key={ing.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px', fontWeight: '500' }}>
                  {ing.name}
                </td>
                <td style={{ padding: '12px', color: '#555' }}>
                  {ing.category}
                </td>
                <td style={{ padding: '12px' }}>
                  {Number(ing.cost_ht).toFixed(2)} €
                </td>
                <td style={{ padding: '12px' }}>{ing.volume_ml} ml</td>
                <td
                  style={{
                    padding: '12px',
                    fontWeight: 'bold',
                    color: '#059669',
                  }}
                >
                  {(ing.cost_ht / ing.volume_ml).toFixed(4)} € / ml
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
