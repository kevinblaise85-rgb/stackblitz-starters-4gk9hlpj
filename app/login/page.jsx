'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      // Inscription
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        alert('Erreur d’inscription : ' + error.message);
      } else {
        alert('Compte créé ! Vérifie tes e-mails pour confirmer ton compte si nécessaire, puis connecte-toi.');
        setIsSignUp(false);
      }
    } else {
      // Connexion
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert('Erreur de connexion : ' + error.message);
      } else {
        // Redirection vers l'accueil ou la gestion des ingrédients
        router.push('/ingredients');
      }
    }
    setLoading(false);
  };

  return (
    <main style={{ padding: '40px 20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>
        🍾 BarCodex - {isSignUp ? 'Inscription' : 'Connexion'}
      </h1>

      <form
        onSubmit={handleAuth}
        style={{
          background: '#f4f4f5',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>E-mail :</label>
          <input
            type="email"
            placeholder="ton@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Mot de passe :</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
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
            marginBottom: '10px',
          }}
        >
          {loading ? 'Chargement...' : isSignUp ? 'Créer un compte' : 'Se connecter'}
        </button>

        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'center',
            fontSize: '14px',
          }}
        >
          {isSignUp ? 'Déjà un compte ? Connecte-toi' : 'Pas de compte ? Inscris-toi'}
        </button>
      </form>
    </main>
  );
}