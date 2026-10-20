'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function IngredientsPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Champs du formulaire (Ajout ou Édition)
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Spiritueux');
  const [costHt, setCostHt] = useState('');
  const [volumeMl, setVolumeMl] = useState('700');

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

  // 2. Charger la liste des ingrédients depuis Supabase
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

  // 3. Soumettre le formulaire (Ajout ou Modification)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !costHt || !volumeMl) {
      alert('Veuillez remplir tous les champs !');
      return;
    }

    setLoading(true);

    if (editingId) {
      // Mode Modification
      const { error } = await supabase
        .from('ingredients')
        .update({
          name,
          category,
          cost_ht: parseFloat(costHt),
          volume_ml: parseFloat(volumeMl),
        })
        .eq('id', editingId);

      setLoading(false);
      if (error) {
        alert('Erreur lors de la modification : ' + error.message);
      } else {
        resetForm();
        fetchIngredients();
      }
    } else {
      // Mode Ajout
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
        alert("Erreur lors de l'ajout : " + error.message);
      } else {
        resetForm();
        fetchIngredients();
      }
    }
  };

  // 4. Préparer le formulaire pour l'édition
  const handleEdit = (ing) => {
    setEditingId(ing.id);
    setName(ing.name);
    setCategory(ing.category);
    setCostHt(ing.cost_ht);
    setVolumeMl(ing.volume_ml);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 5. Supprimer un ingrédient
  const handleDelete = async (id, ingName) => {
    if (!confirm(`Es-tu sûr de vouloir supprimer "${ingName}" ?`)) return;

    const { error } = await supabase.from('ingredients').delete().eq('id', id);
    if (error) {
      alert('Erreur lors de la suppression : ' + error.message);
    } else {
      fetchIngredients();
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCategory('Spiritueux');
    setCostHt('');
    setVolumeMl('700');
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
        maxWidth: '900px',
        margin: '0 auto',
        fontFamily: 'sans-serif',
      }}
    >
      <h2>Gestion des Ingrédients</h2>

      {/* FORMULAIRE D'AJOUT / MODIFICATION */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: editingId ? '#fef3c7' : '#f4f4f5',
          border: editingId ? '1px solid #f59e0b' : '1px solid transparent',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0 }}>
            {editingId ? "Modifier l'ingrédient" : 'Ajouter une bouteille ou un ingrédient'}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              style={{
                background: '#6b7280',
                color: '#fff',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Annuler
            </button>
          )}
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
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
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
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
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
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
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
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
            background: editingId ? '#d97706' : '#10b981',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
            width: '100%',
          }}
        >
          {loading
            ? 'Enregistrement...'
            : editingId
            ? '💾 Mettre à jour l’ingrédient'
            : "+ Ajouter l'ingrédient"}
        </button>
      </form>

      {/* TABLEAU DES INGRÉDIENTS */}
      <h3>Inventaire des bouteilles ({ingredients.length})</h3>
      {ingredients.length === 0 ? (
        <p style={{ color: '#666', fontStyle: 'italic' }}>
          Aucun ingrédient enregistré pour le moment.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
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
                <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ing) => (
                <tr key={ing.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{ing.name}</td>
                  <td style={{ padding: '12px', color: '#555' }}>{ing.category}</td>
                  <td style={{ padding: '12px' }}>{Number(ing.cost_ht).toFixed(2)} €</td>
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
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleEdit(ing)}
                        style={{
                          background: '#3b82f6',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 'bold',
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(ing.id, ing.name)}
                        style={{
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 'bold',
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}