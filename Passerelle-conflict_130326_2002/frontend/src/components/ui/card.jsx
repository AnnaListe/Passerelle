import React from 'react';
import { cn } from '../../lib/utils';

const Card = React.forwardRef(({ className, interactive = false, children, ...props }, ref) => {
  const baseClasses = 'bg-white rounded-2xl border border-border p-6 transition-all duration-300';
  const interactiveClasses = interactive ? 'hover:border-primary/30 hover:shadow-card-hover cursor-pointer group' : '';
  
  return (
    <div
      ref={ref}
      className={cn(baseClasses, interactiveClasses, className)}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 pb-4', className)}
    {...props}
  />
));

CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-xl font-semibold text-slate-700', className)}
    {...props}
  />
));

CardTitle.displayName = 'CardTitle';

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-0', className)} {...props} />
));

CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardContent };
