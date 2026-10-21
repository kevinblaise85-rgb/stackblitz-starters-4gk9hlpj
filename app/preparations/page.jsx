'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function PreparationsPage() {
  const [preparations, setPreparations] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [name, setName] = useState('');
  const [outputVolume, setOutputVolume] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState([]); // [{ ingredient_id, quantity }]
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Récupérer les ingrédients de base
      const { data: ingData } = await supabase.from('ingredients').select('*').order('name');
      setIngredients(ingData || []);

      // Récupérer les préparations existantes avec leurs composants
      const { data: prepData } = await supabase.from('preparations').select('*').order('name');
      
      if (prepData) {
        const fullPreps = await Promise.all(
          prepData.map(async (prep) => {
            const { data: details } = await supabase
              .from('preparation_ingredients')
              .select('quantity, ingredients(name, buy_price_ht, volume_ml)')
              .eq('preparation_id', prep.id);
            return {
              ...prep,
              components: details || [],
            };
          })
        );
        setPreparations(fullPreps);
      }
    } catch (err) {
      console.error('Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComponentRow = () => {
    setSelectedIngredients([...selectedIngredients, { ingredient_id: '', quantity: '' }]);
  };

  const handleComponentChange = (index, field, value) => {
    const updated = [...selectedIngredients];
    updated[index][field] = value;
    setSelectedIngredients(updated);
  };

  const handleRemoveComponentRow = (index) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  const handleAddPreparation = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !outputVolume || selectedIngredients.length === 0) {
      setErrorMsg('Veuillez remplir le nom, le volume final et ajouter au moins un ingrédient.');
      return;
    }

    try {
      // 1. Insérer la préparation
      const { data: prepData, error: prepError } = await supabase
        .from('preparations')
        .insert([{ name: name.trim(), output_volume_ml: parseFloat(outputVolume) }])
        .select()
        .single();

      if (prepError) throw prepError;

      // 2. Insérer les liens dans preparation_ingredients
      const prepIngredientsPayload = selectedIngredients.map((item) => ({
        preparation_id: prepData.id,
        ingredient_id: item.ingredient_id,
        quantity: parseFloat(item.quantity),
      }));

      const { error: linkError } = await supabase.from('preparation_ingredients').insert(prepIngredientsPayload);
      if (linkError) throw linkError;

      // Reset et rechargement
      setName('');
      setOutputVolume('');
      setSelectedIngredients([]);
      fetchData();
    } catch (err) {
      console.error('Erreur ajout préparation:', err.message);
      setErrorMsg(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer cette préparation ?')) return;

    try {
      await supabase.from('preparations').delete().eq('id', id);
      setPreparations(preparations.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  return (
    <main style={{ padding: '30px', maxWidth: '900px', margin: '0 auto', color: '#fff' }}>
      <h2>🧪 Ingrédients Maison & Préparations (Sirops, Infusions...)</h2>

      {/* Formulaire d'ajout */}
      <form
        onSubmit={handleAddPreparation}
        style={{
          background: '#18181b',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
          border: '1px solid #374151',
        }}
      >
        <h3 style={{ marginTop: 0, fontSize: '16px', color: '#10b981' }}>Créer une préparation</h3>

        {errorMsg && (
          <div style={{ background: '#ef444422', color: '#ef4444', padding: '10px', borderRadius: '4px', marginBottom: '15px', border: '1px solid #ef4444', fontSize: '14px' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px' }}>Nom de la préparation</label>
            <input
              type="text"
              placeholder="ex: Sirop de Cannelle Maison"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', background: '#27272a', border: '1px solid #374151', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px' }}>Volume final obtenu (ml)</label>
            <input
              type="number"
              placeholder="ex: 500"
              value={outputVolume}
              onChange={(e) => setOutputVolume(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', background: '#27272a', border: '1px solid #374151', color: '#fff' }}
            />
          </div>
        </div>

        {/* Ingrédients composant la préparation */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Ingrédients composant la recette :</label>
          
          {selectedIngredients.map((comp, index) => (
            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
              <select
                value={comp.ingredient_id}
                onChange={(e) => handleComponentChange(index, 'ingredient_id', e.target.value)}
                required
                style={{ flex: 2, padding: '8px', borderRadius: '4px', background: '#27272a', border: '1px solid #374151', color: '#fff' }}
              >
                <option value="">Sélectionner un ingrédient</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>{ing.name}</option>
                ))}
              </select>

              <input
                type="number"
                step="0.1"
                placeholder="Quantité (ml ou g)"
                value={comp.quantity}
                onChange={(e) => handleComponentChange(index, 'quantity', e.target.value)}
                required
                style={{ flex: 1, padding: '8px', borderRadius: '4px', background: '#27272a', border: '1px solid #374151', color: '#fff' }}
              />

              <button
                type="button"
                onClick={() => handleRemoveComponentRow(index)}
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddComponentRow}
            style={{ background: '#374151', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
          >
            + Ajouter un composant
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
          Enregistrer la préparation
        </button>
      </form>

      {/* Liste des préparations */}
      <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Vos préparations enregistrées</h3>

      {loading ? (
        <p>Chargement...</p>
      ) : preparations.length === 0 ? (
        <p style={{ color: '#9ca3af' }}>Aucune préparation maison pour le moment.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {preparations.map((prep) => {
            // Calcul du coût total de la préparation basé sur les ingrédients
            const totalCost = prep.components?.reduce((sum, item) => {
              const ing = item.ingredients;
              if (!ing || !ing.volume_ml) return sum;
              const costPerUnit = ing.buy_price_ht / ing.volume_ml;
              return sum + costPerUnit * item.quantity;
            }, 0) || 0;

            const costPerMl = prep.output_volume_ml > 0 ? totalCost / prep.output_volume_ml : 0;

            return (
              <div
                key={prep.id}
                style={{
                  background: '#1f2937',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #374151',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#10b981', fontSize: '18px' }}>{prep.name}</h4>
                  <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 10px 0' }}>
                    Volume final : <strong>{prep.output_volume_ml} ml</strong>
                  </p>

                  <div style={{ fontSize: '13px', color: '#d1d5db', marginBottom: '10px' }}>
                    <strong>Composition :</strong>
                    <ul style={{ margin: '5px 0 0 20px', padding: 0 }}>
                      {prep.components?.map((c, idx) => (
                        <li key={idx}>
                          {c.ingredients?.name} : {c.quantity} ml/g
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ fontSize: '13px', background: '#111827', padding: '8px 12px', borderRadius: '4px', borderLeft: '3px solid #10b981' }}>
                    Coût total : <strong>{totalCost.toFixed(2)} €</strong> &bull; Coût unitaire : <strong style={{ color: '#10b981' }}>{costPerMl.toFixed(4)} € / ml</strong>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(prep.id)}
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '13px',
                  }}
                >
                  Supprimer
                </button>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}