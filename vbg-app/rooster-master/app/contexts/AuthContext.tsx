'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://31.97.144.132:4000';

interface User {
  id: number;
  email: string;
  name: string; // ✅ matches your DB schema
  is_verified?: boolean;
  created_at?: string;
  isAdmin?: boolean;
  is_admin?: boolean; // Backend uses is_admin
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      setUser(null);
      
      const res = await fetch(`${API_URL}/api/profile`, {
        method: 'GET',
        credentials: 'include', // Important for sending cookies
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        
        if (data.id || data.user) {
          const userData = data.user || data;
          setUser({
            id: userData.id,
            email: userData.email || '',
            name: userData.name || userData.full_name || 'User',
            is_verified: userData.is_verified,
            created_at: userData.created_at,
            isAdmin: userData.isAdmin || userData.is_admin || false
          });
        } else {
          setUser(null);
        }
      } else {
        // 401 is normal for non-logged-in users, don't log as error
        if (res.status !== 401) {
          console.warn('Auth check failed with status:', res.status);
        }
        setUser(null);
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkAuth();
    }, 100);
    return () => clearTimeout(timer);
  }, [checkAuth]);

  const refreshAuth = async () => {
    setLoading(true);
    await checkAuth();
    setLoading(false);
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setUser(null);
      
      const response = await fetch(
        `${API_URL}/api/login`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json' 
          },
          credentials: 'include', // Important for receiving cookies
          body: JSON.stringify({ email, password })
        }
      );

      console.log('Login API response status:', response.status);
      const data = await response.json();
      console.log('Login API response data:', data);
      
      // After login, verify the session is set by checking the profile
      if (response.ok && data.success) {
        await checkAuth();
      }

      if (!response.ok) {
        return {
          success: false,
          message: data.error || 'Login failed. Please check your credentials.',
        };
      }

      if (data.user) {
        setUser(data.user);
        return { success: true };
      }

      throw new Error('No user data in response');
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed unexpectedly.',
      };
    }
  };

  const logout = async () => {
    try {
      console.log('Starting logout process...');
      
      // Clear any client-side state immediately
      setUser(null);
      setLoading(true);
      
      console.log('Calling logout API...');
      // Clear the session on the server
      const response = await fetch(`${API_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('Logout API response:', response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Logout API success:', data);
      } else {
        console.log('Logout API failed with status:', response.status);
      }
      
      // Clear any browser storage completely
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        // Clear all cookies by setting them to expire
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        console.log('Cleared browser storage and cookies');
      }
      
      console.log('Redirecting to landing page...');
      // Wait longer to ensure server logout completes and cookies are cleared
      setTimeout(() => {
        console.log('Performing redirect to landing page');
        window.location.href = '/';
      }, 500);
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if the server request fails, clear the local state
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        // Clear cookies even on error
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
      }
      // Force complete page reload to landing page with delay
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshAuth }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
