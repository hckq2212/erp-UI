import { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn';

/**
 * Standard Input component aligned with Getvini ERP Web Design System
 * - Uses border-control (#7C8BA1) for crisp 3:1 contrast borders
 * - Uses primary-action focus ring with offset, preventing layout shifts
 * - Web standard border radius: 6px (rounded-md), min-height 36px
 * - Accessible: ARIA invalid, describedby, disabled, readOnly
 */
export const Input = forwardRef(
  (
    {
      label,
      helperText,
      error,
      className,
      id: customId,
      suffix,
      disabled,
      readOnly,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = customId || `input-${generatedId}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const describedBy = [
      error ? errorId : null,
      helperText ? helperId : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-primary mb-1">
            {label}
            {required && <span className="text-danger-strong ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              'block w-full min-h-[36px] rounded-xl bg-surface px-3 py-1.5 text-sm text-text-primary',
              'border border-border-control transition-colors shadow-2xs',
              'placeholder:text-text-muted',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-action focus-visible:ring-offset-1 focus-visible:border-primary-action',
              'disabled:bg-disabled-bg disabled:text-disabled-text disabled:cursor-not-allowed disabled:border-border',
              'read-only:bg-surface-subtle read-only:cursor-default',
              suffix && 'pr-14',
              error && 'border-danger-strong text-danger-strong focus-visible:ring-danger-strong focus-visible:border-danger-strong',
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-text-muted text-xs font-semibold uppercase tracking-wider">{suffix}</span>
            </div>
          )}
        </div>
        {error ? (
          <p id={errorId} className="mt-1 text-xs text-danger-strong font-medium flex items-center gap-1" role="alert">
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p id={helperId} className="mt-1 text-xs text-text-muted">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
