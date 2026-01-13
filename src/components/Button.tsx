import React from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'warning';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const classes = [
    'careify-button',
    `careify-button--${variant}`,
    `careify-button--${size}`,
    fullWidth && 'careify-button--full-width',
    loading && 'careify-button--loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && (
        <span className="careify-button__spinner">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
          </svg>
        </span>
      )}
      {!loading && icon && iconPosition === 'left' && (
        <span className="careify-button__icon careify-button__icon--left">{icon}</span>
      )}
      <span className="careify-button__text">{children}</span>
      {!loading && icon && iconPosition === 'right' && (
        <span className="careify-button__icon careify-button__icon--right">{icon}</span>
      )}
    </button>
  );
};

export default Button;
