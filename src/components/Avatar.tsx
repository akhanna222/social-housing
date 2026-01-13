import React from 'react';
import './Avatar.css';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  className = '',
}) => {
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getColorFromName = (name: string): string => {
    const colors = [
      'var(--color-primary)',
      'var(--color-secondary)',
      'var(--color-accent)',
      'var(--color-success)',
      'var(--color-warning)',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={`careify-avatar careify-avatar--${size} ${className}`}>
      {src ? (
        <img src={src} alt={alt || name || 'Avatar'} className="careify-avatar__image" />
      ) : name ? (
        <span
          className="careify-avatar__initials"
          style={{ backgroundColor: getColorFromName(name) }}
        >
          {getInitials(name)}
        </span>
      ) : (
        <span className="careify-avatar__placeholder">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
              fill="currentColor"
            />
          </svg>
        </span>
      )}
    </div>
  );
};

interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  children,
  max = 4,
  className = '',
}) => {
  const childArray = React.Children.toArray(children);
  const visibleChildren = childArray.slice(0, max);
  const remainingCount = childArray.length - max;

  return (
    <div className={`careify-avatar-group ${className}`}>
      {visibleChildren}
      {remainingCount > 0 && (
        <div className="careify-avatar careify-avatar--md careify-avatar-group__remainder">
          <span className="careify-avatar__initials">+{remainingCount}</span>
        </div>
      )}
    </div>
  );
};

export default Avatar;
