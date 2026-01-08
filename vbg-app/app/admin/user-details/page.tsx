'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

/**
 * This is a redirect component that forwards to the dynamic route.
 * The actual user details functionality is in /app/admin/user-details/[id]/page.tsx
 */
function AdminUserDetailsRedirectContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  useEffect(() => {
    // Check if user is admin (same logic as dashboard)
    const isAdmin = user?.isAdmin || (user as any)?.is_admin || user?.id === 15;
    if (!user || !isAdmin) {
      router.push('/dashboard');
      return;
    }

    // Redirect to dynamic route if userId is provided
    if (userId) {
      router.push(`/admin/user-details/${userId}`);
      return;
    }

    // No userId provided, go back to admin dashboard
    router.push('/dashboard?tab=admin');
  }, [user, userId, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to user details...</p>
      </div>
    </div>
  );
}

export default function AdminUserDetailsRedirect() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AdminUserDetailsRedirectContent />
    </Suspense>
  );
}
