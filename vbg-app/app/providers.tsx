'use client';

import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Header />
      <div className="pt-20">
        {children}
      </div>
    </AuthProvider>
  );
}
