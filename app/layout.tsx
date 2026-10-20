import './globals.css';
import Navbar from './components/Navbar';

export const metadata = {
  title: 'BarCodex',
  description: 'Gestion de bar et inventaire',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      {/* Assure-toi qu'il n'y a pas de style inline avec background blanc ici */}
      <body style={{ backgroundColor: '#0f172a', color: '#f8fafc', margin: 0 }}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}