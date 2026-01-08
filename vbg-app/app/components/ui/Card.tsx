/**
 * Reusable Card Component
 * Uses centralized theme configuration
 */

import { getCardClass } from '@/app/config/theme';

interface CardProps {
  variant?: 'base' | 'hover' | 'bordered' | 'gradient';
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  variant = 'base',
  children,
  className = '',
}) => {
  return (
    <div className={`${getCardClass(variant)} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
