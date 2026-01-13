import React from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  icon,
  iconPosition = 'left',
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`careify-input-wrapper ${className}`}>
      {label && (
        <label htmlFor={inputId} className="careify-input__label">
          {label}
        </label>
      )}
      <div
        className={`careify-input__container ${error ? 'careify-input__container--error' : ''} ${
          icon ? `careify-input__container--has-icon-${iconPosition}` : ''
        }`}
      >
        {icon && iconPosition === 'left' && (
          <span className="careify-input__icon careify-input__icon--left">{icon}</span>
        )}
        <input id={inputId} className="careify-input" {...props} />
        {icon && iconPosition === 'right' && (
          <span className="careify-input__icon careify-input__icon--right">{icon}</span>
        )}
      </div>
      {hint && !error && <p className="careify-input__hint">{hint}</p>}
      {error && <p className="careify-input__error">{error}</p>}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  hint,
  className = '',
  id,
  ...props
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`careify-input-wrapper ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="careify-input__label">
          {label}
        </label>
      )}
      <div className={`careify-input__container ${error ? 'careify-input__container--error' : ''}`}>
        <textarea id={textareaId} className="careify-textarea" {...props} />
      </div>
      {hint && !error && <p className="careify-input__hint">{hint}</p>}
      {error && <p className="careify-input__error">{error}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  hint,
  options,
  placeholder,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`careify-input-wrapper ${className}`}>
      {label && (
        <label htmlFor={selectId} className="careify-input__label">
          {label}
        </label>
      )}
      <div className={`careify-input__container careify-input__container--select ${error ? 'careify-input__container--error' : ''}`}>
        <select id={selectId} className="careify-select" {...props}>
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="careify-select__arrow">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
      {hint && !error && <p className="careify-input__hint">{hint}</p>}
      {error && <p className="careify-input__error">{error}</p>}
    </div>
  );
};

export default Input;
