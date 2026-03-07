import React from 'react';
import { cn, getInitials } from '../../lib/utils';

const Avatar = React.forwardRef(({ className, src, alt, firstName, lastName, size = 'default', ...props }, ref) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    default: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  return (
    <div
      ref={ref}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full bg-primary-light text-primary font-medium overflow-hidden',
        sizes[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span>{getInitials(firstName, lastName)}</span>
      )}
    </div>
  );
});

Avatar.displayName = 'Avatar';

export { Avatar };
