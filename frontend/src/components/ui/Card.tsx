'use client';

import { HTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass';
  hover?: boolean;
  children: React.ReactNode;
}

export function Card({ className, variant = 'default', hover = true, children, ...props }: CardProps) {
  const variantClasses = {
    default: 'card-luxury',
    elevated: 'card-elevated',
    glass: 'card-glass',
  };

  const Component = hover ? motion.div : 'div';
  const motionProps = hover
    ? {
        whileHover: { y: -4, transition: { duration: 0.2, ease: [0.22, 0.9, 0.38, 1] } },
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3, ease: [0.22, 0.9, 0.38, 1] },
      }
    : {};

  // Filter out conflicting props between HTML and framer-motion
  const { onDrag, onDragEnd, onDragStart, onAnimationStart, onAnimationEnd, ...restProps } = props as any;

  return (
    <Component className={cn(variantClasses[variant], className)} {...motionProps} {...restProps}>
      {children}
    </Component>
  );
}

