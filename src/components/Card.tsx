import React from 'react';
import './Card.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  hover = false,
  onClick,
}) => {
  const classes = [
    'careify-card',
    `careify-card--padding-${padding}`,
    hover && 'careify-card--hover',
    onClick && 'careify-card--clickable',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
  action,
}) => {
  return (
    <div className={`careify-card__header ${className}`}>
      <div className="careify-card__header-content">{children}</div>
      {action && <div className="careify-card__header-action">{action}</div>}
    </div>
  );
};

interface CardTitleProps {
  children: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  subtitle,
  className = '',
}) => {
  return (
    <div className={`careify-card__title-wrapper ${className}`}>
      <h3 className="careify-card__title">{children}</h3>
      {subtitle && <p className="careify-card__subtitle">{subtitle}</p>}
    </div>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = '',
}) => {
  return <div className={`careify-card__content ${className}`}>{children}</div>;
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
}) => {
  return <div className={`careify-card__footer ${className}`}>{children}</div>;
};

export default Card;
