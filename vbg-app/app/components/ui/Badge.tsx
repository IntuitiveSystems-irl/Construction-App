/**
 * Reusable Badge Component
 * Uses centralized theme configuration
 */

import { getBadgeClass } from '@/app/config/theme';

interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'gray';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  children,
  className = '',
}) => {
  return (
    <span className={`${getBadgeClass(variant)} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
