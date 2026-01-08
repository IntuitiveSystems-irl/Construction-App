/**
 * VBG Brand Colors
 * Centralized color configuration for consistent branding across the app
 * Based on veribuilds.com color scheme
 */

export const colors = {
  // Primary Brand Colors (Cyan/Teal)
  primary: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4', // Main cyan
    600: '#0891b2', // Main teal
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  },
  
  // Secondary Colors
  secondary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
  
  // Accent Colors
  accent: {
    orange: '#f97316',
    purple: '#a855f7',
    blue: '#3b82f6',
  },
  
  // Status Colors
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
  },
  
  // Neutral Colors
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

// Tailwind class mappings for easy use
export const bgColors = {
  primary: 'bg-cyan-600 hover:bg-cyan-700',
  primaryLight: 'bg-cyan-500 hover:bg-cyan-600',
  secondary: 'bg-teal-600 hover:bg-teal-700',
  gradient: 'bg-gradient-to-r from-cyan-600 to-teal-600',
};

export const textColors = {
  primary: 'text-cyan-600',
  primaryHover: 'hover:text-cyan-700',
  secondary: 'text-teal-600',
};

export const borderColors = {
  primary: 'border-cyan-600',
  secondary: 'border-teal-600',
};

export const ringColors = {
  primary: 'focus:ring-cyan-500',
  secondary: 'focus:ring-teal-500',
};
