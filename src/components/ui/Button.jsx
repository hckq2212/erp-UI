import { forwardRef, isValidElement } from 'react';
import { cn } from '../../utils/cn';

/**
 * Safely render an icon whether it's a React element or a Component (function, forwardRef, memo)
 */
const renderIcon = (Icon, className) => {
  if (!Icon) return null;
  if (isValidElement(Icon)) return Icon;
  if (
    typeof Icon === 'function' ||
    (typeof Icon === 'object' && Icon !== null && ('$$typeof' in Icon || 'render' in Icon))
  ) {
    const Component = Icon;
    return <Component className={className} />;
  }
  return null;
};

/**
 * Standard Button component aligned with Getvini ERP Web Design System
 * - Supports variants: primary (solid brand orange #F38820 + white #ffffff text)
 *                     soft (pastel orange #fff0c2 + #9A3412 text + #C2540A border)
 *                     secondary | danger | ghost | outline
 * - Focus ring: 2px primary-action (#F38820) with outline offset
 * - Web standard border radius: 12px (rounded-xl / control)
 * - Minimum height: 36px (md)
 * - Supports: leadingIcon, trailingIcon, loading, fullWidth, disabled
 */
export const Button = forwardRef(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading,
      loading,
      disabled,
      fullWidth = false,
      leadingIcon: LeadingIcon,
      trailingIcon: TrailingIcon,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isBusy = Boolean(isLoading || loading);
    const isDisabled = Boolean(disabled || isBusy);

    const variants = {
      primary:
        'bg-[#F38820] text-white font-semibold hover:bg-[#DB7414] active:bg-[#C96A10] focus-visible:ring-[#F38820] disabled:bg-[#e5e5e5] disabled:text-[#a8a8a8] shadow-xs',
      soft:
        'bg-[#fff0c2] text-[#9A3412] font-medium border border-[#C2540A] hover:bg-[#ffe295] active:bg-[#ffd06a] active:border-[#A84608] focus-visible:ring-[#F38820] disabled:bg-[#e5e5e5] disabled:text-[#a8a8a8] disabled:border-[#e5e5e5] shadow-xs',
      secondary:
        'bg-surface text-[#1f1f1f] border border-border-control hover:bg-[#ededed] active:bg-[#e5e5e5] focus-visible:ring-[#F38820] shadow-xs',
      outline:
        'bg-transparent border border-border-control text-[#1f1f1f] hover:bg-[#ededed] active:bg-[#e5e5e5] focus-visible:ring-[#F38820]',
      danger:
        'bg-danger-strong text-white hover:bg-[#991B1B] active:bg-[#7F1D1D] focus-visible:ring-danger-strong shadow-xs',
      ghost:
        'bg-transparent text-text-secondary hover:bg-[#ededed] hover:text-[#DB7414] active:bg-[#e5e5e5] focus-visible:ring-[#F38820]',
    };

    const sizes = {
      sm: 'px-3 py-1 text-xs min-h-[32px] gap-1.5',
      md: 'px-4 py-1.5 text-sm min-h-[36px] gap-2',
      lg: 'px-5 py-2.5 text-base min-h-[42px] gap-2.5',
    };

    return (
      <button
        ref={ref}
        type={props.type || 'button'}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-colors select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
          fullWidth && 'w-full',
          variants[variant] || variants.primary,
          sizes[size] || sizes.md,
          className
        )}
        disabled={isDisabled}
        aria-busy={isBusy}
        {...props}
      >
        {isBusy ? (
          <svg
            className="animate-spin -ml-0.5 h-4 w-4 text-current shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : LeadingIcon ? (
          <span className="shrink-0 -ml-0.5">
            {renderIcon(LeadingIcon, 'h-4 w-4')}
          </span>
        ) : null}

        <span>{children}</span>

        {!isBusy && TrailingIcon ? (
          <span className="shrink-0 -mr-0.5">
            {renderIcon(TrailingIcon, 'h-4 w-4')}
          </span>
        ) : null}
      </button>
    );
  }
);

Button.displayName = 'Button';
