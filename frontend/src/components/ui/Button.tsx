'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
  href?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, href, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2';
    
    const variantClasses = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      outline: 'btn-outline',
      ghost: 'btn-ghost',
    };

    const sizeClasses = {
      sm: 'px-4 py-2 text-sm rounded-pill',
      md: 'px-6 py-3 text-base rounded-pill',
      lg: 'px-8 py-4 text-lg rounded-pill',
    };

    const buttonClasses = cn(baseClasses, variantClasses[variant], sizeClasses[size], className);
    const motionProps = {
      whileHover: disabled || isLoading ? {} : { scale: 1.03 },
      whileTap: disabled || isLoading ? {} : { scale: 0.97 },
      transition: { type: 'spring' as const, stiffness: 400, damping: 17 },
      style: { transitionTimingFunction: 'cubic-bezier(0.22, 0.9, 0.38, 1)' },
    };

    // If href is provided, render as Link
    if (href) {
      const content = isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      );

      return (
        <motion.div {...motionProps}>
          <Link href={href} className={buttonClasses} {...(props as any)}>
            {content}
          </Link>
        </motion.div>
      );
    }

    // Default: render as button
    // Filter out conflicting props between HTML and framer-motion
    const { onDrag, onDragEnd, onDragStart, onAnimationStart, onAnimationEnd, ...restProps } = props as any;
    
    return (
      <motion.button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || isLoading}
        {...motionProps}
        {...restProps}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </span>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

