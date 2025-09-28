import React from 'react'

const badgeVariants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/80',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
  outline: 'text-foreground border border-input bg-background hover:bg-accent hover:text-accent-foreground',
}

export function Badge({ 
  className = '', 
  variant = 'default', 
  children, 
  ...props 
}) {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
  
  return (
    <div 
      className={`${baseClasses} ${badgeVariants[variant] || badgeVariants.default} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
} 