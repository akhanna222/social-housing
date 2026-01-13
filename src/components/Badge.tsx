import React from 'react';
import './Badge.css';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'info'
  | 'muted';

export type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  dot = false,
  className = '',
}) => {
  const classes = [
    'careify-badge',
    `careify-badge--${variant}`,
    `careify-badge--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      {dot && <span className="careify-badge__dot" />}
      {icon && <span className="careify-badge__icon">{icon}</span>}
      <span className="careify-badge__text">{children}</span>
    </span>
  );
};

// Status-specific badge for application statuses
interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getVariantAndLabel = (status: string): { variant: BadgeVariant; label: string } => {
    switch (status) {
      case 'draft':
        return { variant: 'muted', label: 'Draft' };
      case 'submitted':
        return { variant: 'info', label: 'Submitted' };
      case 'under_review':
        return { variant: 'primary', label: 'Under review' };
      case 'awaiting_documents':
        return { variant: 'warning', label: 'Awaiting documents' };
      case 'eligible':
        return { variant: 'success', label: 'Eligible' };
      case 'ineligible':
        return { variant: 'muted', label: 'Not eligible' };
      case 'further_review':
        return { variant: 'warning', label: 'Further review needed' };
      case 'approved':
        return { variant: 'success', label: 'Approved' };
      case 'declined':
        return { variant: 'muted', label: 'Application closed' };
      default:
        return { variant: 'default', label: status };
    }
  };

  const { variant, label } = getVariantAndLabel(status);

  return (
    <Badge variant={variant} dot className={className}>
      {label}
    </Badge>
  );
};

// Priority badge
interface PriorityBadgeProps {
  priority: 'standard' | 'urgent' | 'emergency';
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  const getVariantAndLabel = (): { variant: BadgeVariant; label: string } => {
    switch (priority) {
      case 'emergency':
        return { variant: 'warning', label: 'Emergency' };
      case 'urgent':
        return { variant: 'primary', label: 'Urgent' };
      default:
        return { variant: 'muted', label: 'Standard' };
    }
  };

  const { variant, label } = getVariantAndLabel();

  return (
    <Badge variant={variant} size="sm" className={className}>
      {label}
    </Badge>
  );
};

// Document status badge
interface DocumentStatusBadgeProps {
  status: string;
  className?: string;
}

export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({ status, className = '' }) => {
  const getVariantAndLabel = (): { variant: BadgeVariant; label: string } => {
    switch (status) {
      case 'uploaded':
        return { variant: 'info', label: 'Uploaded' };
      case 'processing':
        return { variant: 'primary', label: 'Processing' };
      case 'verified':
        return { variant: 'success', label: 'Verified' };
      case 'needs_review':
        return { variant: 'warning', label: 'Needs review' };
      case 'rejected':
        return { variant: 'muted', label: 'Needs attention' };
      default:
        return { variant: 'default', label: status };
    }
  };

  const { variant, label } = getVariantAndLabel();

  return (
    <Badge variant={variant} size="sm" className={className}>
      {label}
    </Badge>
  );
};

// Confidence badge (for AI suggestions)
interface ConfidenceBadgeProps {
  confidence: 'high' | 'medium' | 'low';
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, className = '' }) => {
  const getVariantAndLabel = (): { variant: BadgeVariant; label: string } => {
    switch (confidence) {
      case 'high':
        return { variant: 'success', label: 'High confidence' };
      case 'medium':
        return { variant: 'warning', label: 'Medium confidence' };
      case 'low':
        return { variant: 'muted', label: 'Low confidence' };
      default:
        return { variant: 'default', label: confidence };
    }
  };

  const { variant, label } = getVariantAndLabel();

  return (
    <Badge variant={variant} size="sm" className={className}>
      {label}
    </Badge>
  );
};

export default Badge;
