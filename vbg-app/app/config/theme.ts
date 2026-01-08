/**
 * Centralized Theme Configuration for VBG
 * 
 * This file contains ALL styling configurations for the entire application.
 * Change values here to rebrand the entire app instantly.
 */

export const theme = {
  // ============================================
  // BRAND COLORS (VBG Construction)
  // ============================================
  colors: {
    // Primary brand color (Light Teal from VBG logo)
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#5A9FB8',  // Light teal from logo
      500: '#5A9FB8',  // Light teal from logo
      600: '#4A8FA8',
      700: '#4A7585',  // Dark teal from logo
      800: '#3A6575',
      900: '#2A5565',
    },
    
    // Secondary color (currently blue)
    secondary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',  // Main blue
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    
    // Accent color (Yellow/Gold from VBG logo)
    accent: {
      50: '#fefce8',
      100: '#fef9c3',
      200: '#fef08a',
      300: '#fde047',
      400: '#facc15',
      500: '#E8C547',  // Main yellow/gold from VBG logo
      600: '#D8B537',
      700: '#C8A527',
      800: '#B89517',
      900: '#A88507',
    },
    
    // Status colors
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Neutral colors
    gray: {
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
  },

  // ============================================
  // COMPONENT STYLES
  // ============================================
  components: {
    // Button styles
    button: {
      primary: 'bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200',
      secondary: 'bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200',
      success: 'bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200',
      danger: 'bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200',
      outline: 'border-2 border-orange-600 text-orange-600 hover:bg-orange-50 font-semibold py-2 px-4 rounded-lg transition-colors duration-200',
      ghost: 'text-orange-600 hover:bg-orange-50 font-semibold py-2 px-4 rounded-lg transition-colors duration-200',
      disabled: 'bg-gray-300 text-gray-500 cursor-not-allowed py-2 px-4 rounded-lg',
    },

    // Card styles
    card: {
      base: 'bg-white rounded-lg shadow-md overflow-hidden',
      hover: 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200',
      bordered: 'bg-white rounded-lg border border-gray-200 overflow-hidden',
      gradient: 'bg-gradient-to-br from-orange-50 to-white rounded-lg shadow-md overflow-hidden',
    },

    // Input styles
    input: {
      base: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200',
      error: 'w-full px-4 py-2 border border-red-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none',
      disabled: 'w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed',
    },

    // Badge styles
    badge: {
      primary: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800',
      secondary: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800',
      success: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800',
      warning: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800',
      danger: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800',
      gray: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800',
    },

    // Alert/Notification styles
    alert: {
      success: 'bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg',
      warning: 'bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg',
      error: 'bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg',
      info: 'bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg',
    },

    // Modal styles
    modal: {
      overlay: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
      container: 'bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto',
      header: 'px-6 py-4 border-b border-gray-200',
      body: 'px-6 py-4',
      footer: 'px-6 py-4 border-t border-gray-200 flex justify-end space-x-3',
    },

    // Table styles
    table: {
      container: 'overflow-x-auto',
      table: 'min-w-full divide-y divide-gray-200',
      thead: 'bg-gray-50',
      th: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
      tbody: 'bg-white divide-y divide-gray-200',
      td: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
      row: 'hover:bg-gray-50 transition-colors duration-150',
    },

    // Navigation styles
    nav: {
      container: 'bg-white shadow-md',
      link: 'text-gray-700 hover:text-orange-600 hover:bg-orange-50 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200',
      activeLink: 'text-orange-600 bg-orange-50 px-3 py-2 rounded-md text-sm font-medium',
    },

    // Sidebar styles
    sidebar: {
      container: 'bg-white border-r border-gray-200 h-full',
      item: 'flex items-center px-4 py-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors duration-200 cursor-pointer',
      activeItem: 'flex items-center px-4 py-3 text-orange-600 bg-orange-50 border-r-4 border-orange-600',
    },
  },

  // ============================================
  // LAYOUT
  // ============================================
  layout: {
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    section: 'py-8',
    grid: {
      cols1: 'grid grid-cols-1 gap-6',
      cols2: 'grid grid-cols-1 md:grid-cols-2 gap-6',
      cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
      cols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
    },
  },

  // ============================================
  // TYPOGRAPHY
  // ============================================
  typography: {
    h1: 'text-4xl font-bold text-gray-900',
    h2: 'text-3xl font-bold text-gray-900',
    h3: 'text-2xl font-bold text-gray-900',
    h4: 'text-xl font-semibold text-gray-900',
    h5: 'text-lg font-semibold text-gray-900',
    h6: 'text-base font-semibold text-gray-900',
    body: 'text-base text-gray-700',
    small: 'text-sm text-gray-600',
    tiny: 'text-xs text-gray-500',
    label: 'block text-sm font-medium text-gray-700 mb-1',
  },

  // ============================================
  // SPACING
  // ============================================
  spacing: {
    xs: 'p-2',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12',
  },

  // ============================================
  // SHADOWS
  // ============================================
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
    none: 'shadow-none',
  },

  // ============================================
  // BORDERS
  // ============================================
  borders: {
    none: 'border-0',
    sm: 'border',
    md: 'border-2',
    lg: 'border-4',
    rounded: {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full',
    },
  },

  // ============================================
  // ANIMATIONS
  // ============================================
  animations: {
    fadeIn: 'animate-fadeIn',
    slideIn: 'animate-slideIn',
    pulse: 'animate-pulse',
    spin: 'animate-spin',
    bounce: 'animate-bounce',
  },

  // ============================================
  // STATUS COLORS (for contracts, documents, etc.)
  // ============================================
  status: {
    pending: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-500',
      badge: 'bg-yellow-100 text-yellow-800',
    },
    approved: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-500',
      badge: 'bg-green-100 text-green-800',
    },
    rejected: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-500',
      badge: 'bg-red-100 text-red-800',
    },
    active: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-500',
      badge: 'bg-blue-100 text-blue-800',
    },
    completed: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-500',
      badge: 'bg-green-100 text-green-800',
    },
    expired: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-500',
      badge: 'bg-red-100 text-red-800',
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get button class based on variant
 */
export const getButtonClass = (variant: keyof typeof theme.components.button = 'primary') => {
  return theme.components.button[variant];
};

/**
 * Get badge class based on variant
 */
export const getBadgeClass = (variant: keyof typeof theme.components.badge = 'primary') => {
  return theme.components.badge[variant];
};

/**
 * Get status classes
 */
export const getStatusClass = (status: keyof typeof theme.status) => {
  return theme.status[status] || theme.status.pending;
};

/**
 * Get card class based on variant
 */
export const getCardClass = (variant: keyof typeof theme.components.card = 'base') => {
  return theme.components.card[variant];
};

// Export default theme
export default theme;
