import Link from 'next/link';

export default function Navbar() {
  return (
    <nav style={{ background: '#18181b', color: '#fff', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <h2 style={{ margin: 0, fontSize: '20px' }}>🍹 BarCodex</h2>
      <div style={{ display: 'flex', gap: '20px' }}>
        <Link href="/ingredients" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}>
          📦 Ingrédients
        </Link>
        <Link href="/recipes" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}>
          📝 Créer
        </Link>
        <Link href="/recipes-list" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}>
          📜 Mes Recettes
        </Link>
      </div>
    </nav>
  );
}