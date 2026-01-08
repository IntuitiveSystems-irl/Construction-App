/**
 * Reusable Button Component
 * Uses centralized theme configuration
 */

import { getButtonClass } from '@/app/config/theme';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost' | 'disabled';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  fullWidth = false,
}) => {
  const buttonVariant = disabled ? 'disabled' : variant;
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${getButtonClass(buttonVariant)} ${widthClass} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
