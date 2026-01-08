'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import Header from './components/Header';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <AuthProvider>
          <Header />
          <main className="pt-24 pb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
