import React from 'react';
import { cn } from '../../lib/utils';

const Button = React.forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'default',
  children, 
  ...props 
}, ref) => {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover rounded-full px-6 py-2.5 font-medium transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md',
    secondary: 'bg-primary-light text-primary-hover hover:bg-[#D1E8E2] rounded-full px-6 py-2.5 font-medium transition-all duration-200',
    outline: 'border-2 border-border text-foreground-muted hover:border-primary hover:text-primary bg-transparent rounded-full px-6 py-2.5 font-medium transition-all',
    ghost: 'text-foreground-muted hover:text-primary hover:bg-background-subtle rounded-lg px-4 py-2 transition-colors',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 rounded-full px-6 py-2.5 font-medium transition-colors'
  };

  const sizes = {
    sm: 'text-sm px-4 py-2',
    default: 'px-6 py-2.5',
    lg: 'px-8 py-3 text-lg'
  };

  return (
    <button
      className={cn(variants[variant], sizes[size], className)}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export { Button };
