import React from 'react';
import { cn } from '../../lib/utils';

const Badge = React.forwardRef(({ className, variant = 'default', children, ...props }, ref) => {
  const variants = {
    default: 'bg-slate-100 text-slate-600 border-slate-200',
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    success: 'bg-green-100 text-green-700 border-green-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    warning: 'bg-orange-100 text-orange-700 border-orange-200',
  };

  return (
    <span
      ref={ref}
      className={cn(
        'px-3 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export { Badge };
