'use client';

import React from "react";

interface CheckboxProps {
  id?: string;
  className?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => (
    <input
      type="checkbox"
      ref={ref}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      disabled={disabled}
      className={`h-4 w-4 rounded border border-gray-300 bg-white 
        checked:bg-blue-500 checked:border-blue-500 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${className}`}
      {...props}
    />
  )
);

Checkbox.displayName = "Checkbox";

export { Checkbox };