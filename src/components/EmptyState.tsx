import React from 'react';
import './EmptyState.css';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`careify-empty-state ${className}`}>
      {icon && <div className="careify-empty-state__icon">{icon}</div>}
      <h3 className="careify-empty-state__title">{title}</h3>
      {description && <p className="careify-empty-state__description">{description}</p>}
      {action && <div className="careify-empty-state__action">{action}</div>}
    </div>
  );
};

// Loading state with gentle messaging
interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'This may take a moment, thank you for your patience',
  className = '',
}) => {
  return (
    <div className={`careify-loading-state ${className}`}>
      <div className="careify-loading-state__spinner">
        <svg viewBox="0 0 50 50">
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="31.4 31.4"
          />
        </svg>
      </div>
      <p className="careify-loading-state__message">{message}</p>
    </div>
  );
};

// Success state with reassurance
interface SuccessStateProps {
  title: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  title,
  message,
  action,
  className = '',
}) => {
  return (
    <div className={`careify-success-state ${className}`}>
      <div className="careify-success-state__icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path
            d="M8 12L11 15L16 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3 className="careify-success-state__title">{title}</h3>
      {message && <p className="careify-success-state__message">{message}</p>}
      {action && <div className="careify-success-state__action">{action}</div>}
    </div>
  );
};

export default EmptyState;
