import React from 'react';
import './Progress.css';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showValue = true,
  size = 'md',
  variant = 'default',
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`careify-progress ${className}`}>
      {(label || showValue) && (
        <div className="careify-progress__header">
          {label && <span className="careify-progress__label">{label}</span>}
          {showValue && (
            <span className="careify-progress__value">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div
        className={`careify-progress__track careify-progress__track--${size}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`careify-progress__fill careify-progress__fill--${variant}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
  className?: string;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  currentStep,
  totalSteps,
  labels,
  className = '',
}) => {
  return (
    <div className={`careify-step-progress ${className}`}>
      <div className="careify-step-progress__header">
        <span className="careify-step-progress__label">
          Step {currentStep} of {totalSteps}
        </span>
      </div>
      <div className="careify-step-progress__track">
        {Array.from({ length: totalSteps }, (_, i) => (
          <React.Fragment key={i}>
            <div
              className={`careify-step-progress__step ${
                i + 1 <= currentStep
                  ? 'careify-step-progress__step--completed'
                  : 'careify-step-progress__step--pending'
              } ${i + 1 === currentStep ? 'careify-step-progress__step--current' : ''}`}
            >
              {i + 1 < currentStep ? (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M5 12L10 17L19 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <span>{i + 1}</span>
              )}
            </div>
            {i < totalSteps - 1 && (
              <div
                className={`careify-step-progress__connector ${
                  i + 1 < currentStep
                    ? 'careify-step-progress__connector--completed'
                    : ''
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      {labels && labels.length === totalSteps && (
        <div className="careify-step-progress__labels">
          {labels.map((label, i) => (
            <span
              key={i}
              className={`careify-step-progress__step-label ${
                i + 1 === currentStep ? 'careify-step-progress__step-label--current' : ''
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
