'use client';

import React from "react";

interface LabelProps {
  htmlFor?: string;
  className?: string;
  children?: React.ReactNode;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ htmlFor, className, children, ...props }, ref) => (
    <label
      ref={ref}
      htmlFor={htmlFor}
      className={className}
      {...props}
    >
      {children}
    </label>
  )
);

Label.displayName = "Label";

export { Label };