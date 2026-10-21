'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState([]);
  const [name, setName] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [volumeMl, setVolumeMl] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('ingredients').select('*').order('name', { ascending: true });
      if (error) throw error;
      setIngredients(data || []);
    } catch (err) {
      console.error('Erreur chargement ingrédients:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !buyPrice || !volumeMl) {
      setErrorMsg('Veuillez remplir tous les champs.');
      return;
    }

    try {
      const { data, error } = await supabase.from('ingredients').insert([
        {
          name: name.trim(),
          buy_price_ht: parseFloat(buyPrice),
          volume_ml: parseFloat(volumeMl),
        },
      ]).select();

      if (error) throw error;

      if (data) {
        setIngredients([...ingredients, data[0]]);
        setName('');
        setBuyPrice('');
        setVolumeMl('');
      }
    } catch (err) {
      console.error('Erreur ajout ingrédient:', err.message);
      setErrorMsg(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer cet ingrédient ?')) return;

    try {
      const { error } = await supabase.from('ingredients').delete().eq('id', id);
      if (error) throw error;
      setIngredients(ingredients.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Erreur suppression:', err.message);
    }
  };

  return (
    <main style={{ padding: '30px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <h2>📦 Gestion des Ingrédients</h2>

      {/* Formulaire d'ajout */}
      <form
        onSubmit={handleAddIngredient}
        style={{
          background: '#18181b',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
          border: '1px solid #374151',
        }}
      >
        <h3 style={{ marginTop: 0, fontSize: '16px', color: '#10b981' }}>Ajouter un nouvel ingrédient</h3>

        {errorMsg && (
          <div style={{ background: '#ef444422', color: '#ef4444', padding: '10px', borderRadius: '4px', marginBottom: '15px', border: '1px solid #ef4444', fontSize: '14px' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px' }}>Nom</label>
            <input
              type="text"
              placeholder="ex: Rhum Blanc"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', background: '#27272a', border: '1px solid #374151', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px' }}>Prix d'achat HT (€)</label>
            <input
              type="number"
              step="0.01"
              placeholder="ex: 15.50"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', background: '#27272a', border: '1px solid #374151', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px' }}>Volume (ml)</label>
            <input
              type="number"
              placeholder="ex: 700"
              value={volumeMl}
              onChange={(e) => setVolumeMl(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', background: '#27272a', border: '1px solid #374151', color: '#fff' }}
            />
          </div>
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
          ➕ Ajouter l'ingrédient
        </button>
      </form>

      {/* Liste des ingrédients */}
      <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Liste de vos ingrédients</h3>

      {loading ? (
        <p>Chargement...</p>
      ) : ingredients.length === 0 ? (
        <p style={{ color: '#9ca3af' }}>Aucun ingrédient enregistré pour le moment.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {ingredients.map((ing) => {
const costPerMl = ing.volume_ml > 0 ? (ing.buy_price_ht / ing.volume_ml).toFixed(4) : 0;
            return (
              <div
                key={ing.id}
                style={{
                  background: '#1f2937',
                  padding: '15px',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid #374151',
                }}
              >
                <div>
                  <strong style={{ fontSize: '16px', color: '#10b981' }}>{ing.name}</strong>
                  <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
                    {ing.buy_price_ht} € HT pour {ing.volume_ml} ml &bull; <span style={{ color: '#d1d5db' }}>Coût : {costPerMl} € / ml</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(ing.id)}
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