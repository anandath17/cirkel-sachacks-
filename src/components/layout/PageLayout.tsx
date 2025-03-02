interface PageLayoutProps {
  children: React.ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="pt-8 pb-8">
        {children}
      </main>
    </div>
  );
} 