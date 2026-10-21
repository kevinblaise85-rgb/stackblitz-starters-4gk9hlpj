import './globals.css';
import AuthCheck from './AuthCheck';
import Navbar from './components/Navbar';

export const metadata = {
  title: 'BarCodex',
  description: 'Gestion de bar et recettes',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ background: '#121212', color: '#fff', margin: 0, fontFamily: 'sans-serif' }}>
        <AuthCheck />
        <Navbar />
        {children}
      </body>
    </html>
  );
}