'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setErrorMsg('');

    try {
      // Promesse de sécurité en cas de blocage réseau/Supabase
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Délai d’attente dépassé (Timeout). Vérifiez votre connexion ou vos clés Supabase.')), 8000)
      );

      // Appel Supabase
      const authPromise = supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      // Course entre Supabase et le Timeout
      const { data, error } = await Promise.race([authPromise, timeoutPromise]);

      if (error) {
        console.error('Erreur Supabase Auth:', error);
        setErrorMsg(error.message || 'Erreur de connexion.');
        setLoading(false);
        return;
      }

      if (data?.session) {
        window.location.href = '/';
      } else {
        setErrorMsg('Échec de la connexion. Vérifiez votre e-mail et votre mot de passe.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Erreur globale connexion:', err);
      setErrorMsg(err.message || 'Impossible de contacter le serveur.');
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#121212',
        color: '#fff',
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          background: '#18181b',
          padding: '30px',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}
      >
        <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>🍹 Connexion BarCodex</h2>

        {errorMsg && (
          <div
            style={{
              background: '#ef444422',
              color: '#ef4444',
              padding: '10px',
              borderRadius: '6px',
              marginBottom: '15px',
              fontSize: '14px',
              border: '1px solid #ef4444',
            }}
          >
            {errorMsg}
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #374151',
              background: '#27272a',
              color: '#fff',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #374151',
              background: '#27272a',
              color: '#fff',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '4px',
            border: 'none',
            background: loading ? '#374151' : '#10b981',
            color: '#fff',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Connexion en cours...' : 'Se connecter'}
        </button>
      </form>
    </main>
  );
}