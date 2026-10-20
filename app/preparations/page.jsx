'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function PreparationsPage() {
  const [ingredients, setIngredients] = useState([]);
  const [prepName, setPrepName] = useState('');
  const [outputVolume, setOutputVolume] = useState('');
  const [selectedItems, setSelectedItems] = useState([
    { ingredient_id: '', quantity_used: '' }
  ]);

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    const { data } = await supabase.from('ingredients').select('*');
    if (data) setIngredients(data);
  };

  const handleAddItem = () => {
    setSelectedItems([...selectedItems, { ingredient_id: '', quantity_used: '' }]);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...selectedItems];
    updated[index][field] = value;
    setSelectedItems(updated);
  };

  const handleCreatePreparation = async (e) => {
    e.preventDefault();
    if (!prepName || !outputVolume || selectedItems.length === 0) return;

    // 1. Calculer le coût total des ingrédients bruts
    let totalCost = 0;
    for (const item of selectedItems) {
      const ing = ingredients.find((i) => i.id === item.ingredient_id);
      if (ing) {
        const costPerMl = ing.buy_price_ht / ing.volume_ml;
        totalCost += costPerMl * parseFloat(item.quantity_used || 0);
      }
    }

    const calculatedCostPerMl = totalCost / parseFloat(outputVolume);

    // 2. Ajouter automatiquement la préparation en tant que nouvel INGRÉDIENT pour les cocktails
    const { data: newIng, error: ingError } = await supabase
      .from('ingredients')
      .insert([
        {
          name: `${prepName} (Maison)`,
          category: 'Maison / Préparation',
          buy_price_ht: totalCost.toFixed(2),
          volume_ml: parseFloat(outputVolume),
          stock_qty: 1,
        },
      ])
      .select()
      .single();

    if (ingError) {
      alert('Erreur lors de la création');
      return;
    }

    // 3. Déduire du stock la quantité de produits bruts utilisés (Optionnel / Automatique)
    for (const item of selectedItems) {
      const ing = ingredients.find((i) => i.id === item.ingredient_id);
      if (ing && ing.current_open_ml !== undefined) {
        const newMl = Math.max(0, (ing.current_open_ml || 0) - parseFloat(item.quantity_used));
        await supabase.from('ingredients').update({ current_open_ml: newMl }).eq('id', ing.id);
      }
    }

    alert('Préparation maison enregistrée et ajoutée à vos ingrédients !');
    setPrepName('');
    setOutputVolume('');
    setSelectedItems([{ ingredient_id: '', quantity_used: '' }]);
  };

  return (
    <main style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🧪 Créer un Ingrédient Maison (Batch / Préparation)</h2>

      <form onSubmit={handleCreatePreparation} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label>Nom de la préparation :</label>
          <input
            type="text"
            placeholder="ex: Sirop de Passoa & Passion maison"
            value={prepName}
            onChange={(e) => setPrepName(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label>Volume total produit (en ml) :</label>
          <input
            type="number"
            placeholder="ex: 1000"
            value={outputVolume}
            onChange={(e) => setOutputVolume(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>

        <h3>Produits bruts utilisés :</h3>
        {selectedItems.map((item, index) => (
          <div key={index} style={{ display: 'flex', gap: '10px' }}>
            <select
              value={item.ingredient_id}
              onChange={(e) => handleItemChange(index, 'ingredient_id', e.target.value)}
              required
              style={{ flex: 2 }}
            >
              <option value="">-- Choisir un ingrédient --</option>
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Qté (ml ou g)"
              value={item.quantity_used}
              onChange={(e) => handleItemChange(index, 'quantity_used', e.target.value)}
              required
              style={{ flex: 1 }}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddItem}
          style={{ background: '#3b82f6', color: '#fff', padding: '8px', border: 'none' }}
        >
          + Ajouter un autre ingrédient
        </button>

        <button
          type="submit"
          style={{ background: '#10b981', color: '#fff', padding: '12px', border: 'none', fontWeight: 'bold' }}
        >
          ⚙️ Fabriquer et déduire du stock
        </button>
      </form>
    </main>
  );
}