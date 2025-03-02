import { ReactNode } from 'react';
import { Header } from '../Header';
import { Footer } from '../footer/Footer';

interface PageLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export function PageLayout({ children, showHeader = true, showFooter = true }: PageLayoutProps) {
  return (
    <div className="bg-gray-50 min-h-screen">
      {showHeader && <Header />}
      <main className="pt-32 pb-24">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}