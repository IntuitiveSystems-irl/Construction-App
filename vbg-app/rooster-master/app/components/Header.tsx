'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      // Logout function handles redirect to /login
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback redirect if logout fails
      router.push('/login');
    }
  };

  // Show a minimal header while loading to prevent layout shift
  if (loading) {
    return (
      <header className="fixed bg-white shadow-lg w-full z-50">
        <div className="h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600"></div>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600">
              ROOSTER
            </span>
          </div>
        </div>
      </header>
    );
  }

  const isLoggedIn = !!user;

  const isActive = (path: string) =>
    pathname === path
      ? 'relative text-red-700 font-medium after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-gradient-to-r after:from-yellow-500 after:to-red-600 after:animate-underline'
      : 'text-gray-800 hover:text-red-600 transition-colors duration-200';


  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className={`${pathname === '/' ? 'absolute' : 'fixed bg-white shadow-lg'} w-full z-50`}>
      {/* Gradient accent bar */}
      <div className="h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600"></div>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes underline {
          from { width: 0; }
          to { width: 100%; }
        }
        .animate-underline {
          animation: underline 0.3s ease-out forwards;
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-12">
            <Link
              href="/"
              className="flex-shrink-0 group"
            >
              <span className="text-2xl font-bold tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 group-hover:from-yellow-400 group-hover:to-red-500 transition-all duration-300">
                  ROOSTER
                </span>
              </span>
            </Link>
            <nav className="hidden md:flex space-x-8">
              {/* Home link - Dashboard for logged in users, landing page for others */}
              <Link
                href={isLoggedIn ? "/dashboard" : "/"}
                className={`${isActive(isLoggedIn ? '/dashboard' : '/')} relative px-3 py-2.5 text-sm font-medium`}
              >
                Home
              </Link>
              
              {/* Only show these links when logged in */}
              {isLoggedIn && (
                <>
                  <Link
                    href={((user as any)?.isAdmin || (user as any)?.is_admin) ? "/admin/documents" : "/document"}
                    className={`${isActive(((user as any)?.isAdmin || (user as any)?.is_admin) ? '/admin/documents' : '/document')} relative px-3 py-2.5 text-sm font-medium`}
                  >
                    Documents
                  </Link>
                  <Link
                    href="/contracts"
                    className={`${isActive('/contracts')} relative px-3 py-2.5 text-sm font-medium`}
                  >
                    Contracts
                  </Link>
                  <Link
                    href="/profile"
                    className={`${isActive('/profile')} relative px-3 py-2.5 text-sm font-medium`}
                  >
                    Profile
                  </Link>

                </>
              )}
            </nav>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="group relative px-5 py-2.5 overflow-hidden font-medium rounded-lg bg-gradient-to-br from-red-600 to-orange-500 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <span className="relative z-10">Logout</span>
                <span className="absolute inset-0 bg-gradient-to-br from-red-700 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-white px-4 py-2.5 text-sm font-medium transition-all duration-200 border border-gray-300 rounded-lg hover:bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 hover:border-transparent hover:shadow-lg hover:shadow-yellow-100"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="relative px-5 py-2.5 overflow-hidden font-medium rounded-lg bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover:shadow-yellow-100 transition-all duration-200 group"
                >
                  <span className="relative z-10">Get Started</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              aria-label="Toggle mobile menu"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-red-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`} id="mobile-menu">
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href={isLoggedIn ? "/dashboard" : "/"}
            onClick={closeMobileMenu}
            className={`${isActive(isLoggedIn ? '/dashboard' : '/')} block pl-3 pr-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100`}
          >
            Home
          </Link>
          {isLoggedIn && (
            <>
              <Link
                href={((user as any)?.isAdmin || (user as any)?.is_admin) ? "/admin/documents" : "/document"}
                onClick={closeMobileMenu}
                className={`${isActive(((user as any)?.isAdmin || (user as any)?.is_admin) ? '/admin/documents' : '/document')} block pl-3 pr-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100`}
              >
                Documents
              </Link>
              <Link
                href="/contracts"
                onClick={closeMobileMenu}
                className={`${isActive('/contracts')} block pl-3 pr-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100`}
              >
                Contracts
              </Link>
              <Link
                href="/profile"
                onClick={closeMobileMenu}
                className={`${isActive('/profile')} block pl-3 pr-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100`}
              >
                Profile
              </Link>
            </>
          )}
          {isLoggedIn ? (
            <button
              onClick={() => {
                handleLogout();
                closeMobileMenu();
              }}
              className="w-full text-left block px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100"
            >
              Logout
            </button>
          ) : (
            <div className="px-4 py-3 space-y-3 border-t border-gray-100">

              <Link
                href="/login"
                onClick={closeMobileMenu}
                className="block w-full px-4 py-2 text-center text-base font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 hover:border-yellow-200"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                onClick={closeMobileMenu}
                className="block w-full px-4 py-2.5 text-center text-base font-medium text-white bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 rounded-lg hover:from-yellow-400 hover:to-red-500 transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-yellow-100"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
