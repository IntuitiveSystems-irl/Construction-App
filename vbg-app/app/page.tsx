'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Only redirect if user is authenticated and not loading
    if (!loading && user) {
      try {
        // Redirect to dashboard
        router.push('/dashboard');
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }
  }, [user, loading, router]);

  // Show loading while checking auth status - but timeout after 3 seconds
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading VBG...</p>
        </div>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-white shadow-xl shadow-orange-600/10 ring-1 ring-orange-50 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center"></div>
        </div>
        
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-gray-50/80"></div>
        
        <div className="relative mx-auto max-w-7xl px-6 pt-32 pb-32 sm:pt-48 lg:pt-56 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700">
              Built for Strength.
              <span className="block mt-4">Designed for Life.</span>
            </h1>
            <p className="mt-8 text-xl leading-8 text-gray-600 max-w-3xl mx-auto">
              At VBG, we turn ideas into reality with unmatched craftsmanship, integrity, and attention to detail.
            </p>
            <div className="mt-12 flex items-center justify-center gap-6 flex-wrap">
              <Link
                href="/register"
                className="group relative px-8 py-4 overflow-hidden rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold shadow-lg hover:shadow-xl transform transition-all duration-200 hover:-translate-y-0.5 hover:shadow-teal-500/20"
              >
                <span className="relative z-10">Get Started</span>
                <span className="absolute inset-0 bg-gradient-to-r from-teal-600 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </Link>
              <Link 
                href="/login" 
                className="px-6 py-4 text-gray-600 hover:text-teal-600 font-medium group transition-colors duration-200 border-b-2 border-transparent hover:border-teal-600"
              >
                Sign In 
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform duration-200">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-24 sm:py-32 bg-gradient-to-b from-black/50 to-gray-900/80 backdrop-blur-sm">
        <div className="absolute inset-0 -z-10 bg-[url('https://roosterconstruction.org/wp-content/uploads/2025/09/RC_PalmSprings_202507-23-scaled.jpg')] bg-cover bg-center opacity-10"></div>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl lg:text-center">
            <span className="text-sm font-semibold leading-7 text-teal-400">WHAT WE DO</span>
            <h2 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Comprehensive Services with a <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-500">Personal Touch</span>
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Delivering excellence in every project with precision, innovation, and unwavering commitment to quality.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-5xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2">
              <div className="relative group bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-400/20 group-hover:bg-teal-400/30 transition-colors">
                    <svg className="h-8 w-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-white">Residential Construction</h3>
                </div>
                <p className="text-gray-300 leading-7">
                  Custom homes, ADUs, and full-scale builds that reflect your lifestyle and vision.
                </p>
              </div>

              <div className="relative group bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-400/20 group-hover:bg-teal-400/30 transition-colors">
                    <svg className="h-8 w-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-white">Commercial Projects</h3>
                </div>
                <p className="text-gray-300 leading-7">
                  Durable, code-compliant commercial builds that support your business growth.
                </p>
              </div>

              <div className="relative group bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-400/20 group-hover:bg-teal-400/30 transition-colors">
                    <svg className="h-8 w-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-white">Quality Assurance</h3>
                </div>
                <p className="text-gray-300 leading-7">
                  Rigorous quality control and testing to ensure every project meets the highest standards.
                </p>
              </div>

              <div className="relative group bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-400/20 group-hover:bg-teal-400/30 transition-colors">
                    <svg className="h-8 w-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-white">On-Time Delivery</h3>
                </div>
                <p className="text-gray-300 leading-7">
                  Reliable project management and scheduling to deliver your project on time and on budget.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call To Action Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5')] bg-cover bg-center opacity-20"></div>
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Ready to Build Your Vision?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
              Join hundreds of satisfied clients who trust VBG for their most important projects.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/register"
                className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-8 py-4 text-sm font-semibold text-white shadow-lg hover:from-teal-600 hover:to-cyan-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 transition-all duration-200 hover:scale-105"
              >
                Get Started Today
              </Link>
              <Link 
                href="/login" 
                className="text-sm font-semibold leading-6 text-white hover:text-teal-400 transition-colors duration-200"
              >
                Already have an account? <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
