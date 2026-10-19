export default function Home() {
  return (
    <main style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🍾 Bienvenue sur BarCodex</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Gère ton inventaire et calcule tes coûts de cocktails en toute simplicité.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <a
          href="/ingredients"
          style={{
            padding: '15px 20px',
            background: '#10b981',
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          📦 Gérer les Ingrédients & Bouteilles
        </a>

        <a
          href="/recipes-list"
          style={{
            padding: '15px 20px',
            background: '#3b82f6',
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          🍸 Voir la liste des Recettes
        </a>
      </div>
    </main>
  );
}