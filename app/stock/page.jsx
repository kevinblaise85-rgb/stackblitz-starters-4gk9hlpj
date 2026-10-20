'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function StockPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [ingredients, setIngredients] = useState([]);
  const [wastageList, setWastageList] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [lossMl, setLossMl] = useState('');
  const [reason, setReason] = useState('Casse / Bouteille brisée');
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
        fetchData();
      }
    };
    checkAuth();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    const [ingRes, wasteRes] = await Promise.all([
      supabase.from('ingredients').select('*').order('name', { ascending: true }),
      supabase.from('wastage').select('*, ingredients(name)').order('created_at', { ascending: false }).limit(20),
    ]);

    setIngredients(ingRes.data || []);
    setWastageList(wasteRes.data || []);
    setLoading(false);
  };

  // Mettre à jour le stock (Nombre de bouteilles en réserve)
  const handleUpdateStock = async (id, newQty) => {
    const qty = parseInt(newQty) || 0;
    const { error } = await supabase
      .from('ingredients')
      .update({ stock_qty: qty })
      .eq('id', id);

    if (error) {
      alert('Erreur mise à jour stock: ' + error.message);
    } else {
      setIngredients(
        ingredients.map((ing) => (ing.id === id ? { ...ing, stock_qty: qty } : ing))
      );
    }
  };

  // Enregistrer une perte
  const handleAddWastage = async (e) => {
    e.preventDefault();
    if (!selectedIngredient || !lossMl) {
      alert('Veuillez sélectionner un ingrédient et indiquer le volume perdu.');
      return;
    }

    const ing = ingredients.find((i) => i.id === selectedIngredient);
    if (!ing || !ing.volume_ml) return;

    const lossVolume = parseFloat(lossMl);
    const costLoss = (ing.cost_ht / ing.volume_ml) * lossVolume;

    setLoading(true);

    const { error } = await supabase.from('wastage').insert([
      {
        ingredient_id: selectedIngredient,
        quantity_ml: lossVolume,
        reason: reason,
        cost_loss_ht: costLoss,
      },
    ]);

    if (error) {
      alert('Erreur enregistrement perte : ' + error.message);
    } else {
      alert(`Perte enregistrée (${costLoss.toFixed(2)} € HT).`);
      setLossMl('');
      fetchData();
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <main style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <p>Vérification de l'accès...</p>
      </main>
    );
  }

  // Calcul du coût total des pertes enregistrées
  const totalWastageCost = wastageList.reduce((sum, w) => sum + (Number(w.cost_loss_ht) || 0), 0);

  return (
    <main style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>📦 Gestion des Stocks & Declarations de Pertes (Wastage)</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {/* FORMULAIRE DE PERTE */}
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#dc2626' }}>🚨 Déclarer une perte / coulage</h3>
          <form onSubmit={handleAddWastage}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Ingrédient :</label>
              <select
                value={selectedIngredient}
                onChange={(e) => setSelectedIngredient(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">Sélectionner une bouteille / ingrédient</option>
                {ingredients.map((i) => (
                  <option key={i.id} value={i.id}>{i.name} ({i.category})</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Volume perdu (ml) :</label>
              <input
                type="number"
                placeholder="ex: 700 ml (bouteille complète), 50 ml..."
                value={lossMl}
                onChange={(e) => setLossMl(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Motif de la perte :</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="Casse / Bouteille brisée">Casse / Bouteille brisée</option>
                <option value="Erreur de dosage / Verre jeté">Erreur de dosage / Verre jeté</option>
                <option value="Dégustation / Offert">Dégustation / Offert</option>
                <option value="Péremption / Altération">Péremption / Altération</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: '#dc2626', color: '#fff', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Enregistrer la perte
            </button>
          </form>
        </div>

        {/* RÉSUMÉ FINANCIER PERTES */}
        <div style={{ background: '#f4f4f5', padding: '20px', borderRadius: '8px', border: '1px solid #e4e4e7', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 10px 0', color: '#18181b' }}>📉 Impact Financier du Coulage</h3>
            <p style={{ color: '#666', fontSize: '14px', margin: '0 0 20px 0' }}>
              Total des pertes récentes enregistrées au bar :
            </p>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc2626' }}>
              - {totalWastageCost.toFixed(2)} € HT
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#71717a', marginTop: '15px' }}>
            💡 Les pertes sont calculées au prorata exact du coût au ml de chaque bouteille.
          </div>
        </div>
      </div>

      {/* TABLEAU DES STOCKS BASSES ET RÉSERVES */}
      <h3 style={{ marginTop: '30px' }}>📋 Inventaire des Bouteilles en Réserve</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e4e4e7', borderRadius: '8px', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#f4f4f5', textAlign: 'left', borderBottom: '1px solid #e4e4e7' }}>
            <th style={{ padding: '12px' }}>Ingrédient</th>
            <th style={{ padding: '12px' }}>Catégorie</th>
            <th style={{ padding: '12px' }}>Contenance</th>
            <th style={{ padding: '12px' }}>Bouteilles en Stock</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((ing) => (
            <tr key={ing.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>{ing.name}</td>
              <td style={{ padding: '12px', color: '#666' }}>{ing.category}</td>
              <td style={{ padding: '12px' }}>{ing.volume_ml} ml</td>
              <td style={{ padding: '12px' }}>
                <input
                  type="number"
                  min="0"
                  value={ing.stock_qty || 0}
                  onChange={(e) => handleUpdateStock(ing.id, e.target.value)}
                  style={{ width: '70px', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontWeight: 'bold', textAlign: 'center' }}
                />{' '}
                unités
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* HISTORIQUE DES PERTES */}
      <h3 style={{ marginTop: '40px' }}>📜 Historique des Dernières Pertes</h3>
      {wastageList.length === 0 ? (
        <p style={{ color: '#666' }}>Aucune perte enregistrée pour le moment.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e4e4e7', borderRadius: '8px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#f4f4f5', textAlign: 'left', borderBottom: '1px solid #e4e4e7' }}>
              <th style={{ padding: '10px' }}>Date</th>
              <th style={{ padding: '10px' }}>Ingrédient</th>
              <th style={{ padding: '10px' }}>Motif</th>
              <th style={{ padding: '10px' }}>Volume</th>
              <th style={{ padding: '10px' }}>Coût Perdu</th>
            </tr>
          </thead>
          <tbody>
            {wastageList.map((w) => (
              <tr key={w.id} style={{ borderBottom: '1px solid #f3f4f6', fontSize: '14px' }}>
                <td style={{ padding: '10px', color: '#666' }}>
                  {new Date(w.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>{w.ingredients?.name || 'Inconnu'}</td>
                <td style={{ padding: '10px' }}>{w.reason}</td>
                <td style={{ padding: '10px' }}>{w.quantity_ml} ml</td>
                <td style={{ padding: '10px', color: '#dc2626', fontWeight: 'bold' }}>
                  -{Number(w.cost_loss_ht).toFixed(2)} € HT
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}