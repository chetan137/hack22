import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';

export const Card = React.forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-md shadow-2xl relative overflow-hidden",
          className
        )}
        {...props}
      >
        {children as React.ReactNode}
      </motion.div>
    );
  }
);
Card.displayName = 'Card';

export const GlassPanel = React.forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn("glass-panel rounded-3xl p-8 relative overflow-hidden", className)}
        {...props}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-slate-900/50 opacity-50 pointer-events-none" />
        <div className="relative z-10">{children as React.ReactNode}</div>
      </motion.div>
    );
  }
);
GlassPanel.displayName = 'GlassPanel';
