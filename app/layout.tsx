import Navbar from './components/Navbar';
import './globals.css';

export const metadata = {
  title: 'BarCodex',
  description: 'Gestion de bar et calcul de marges',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, background: '#f9f9fb' }}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}