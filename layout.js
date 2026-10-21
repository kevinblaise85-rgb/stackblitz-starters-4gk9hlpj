import './globals.css';
import AuthCheck from './AuthCheck'; // Ajuste le chemin si ton fichier AuthCheck est ailleurs (ex: './components/AuthCheck')

export const metadata = {
  title: 'BarCodex',
  description: 'Gestion de bar et recettes',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ background: '#121212', color: '#fff', margin: 0, fontFamily: 'sans-serif' }}>
        {/* Vérifie l'authentification sur toutes les pages */}
        <AuthCheck />
        {children}
      </body>
    </html>
  );
}