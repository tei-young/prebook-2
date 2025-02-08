'use client';

import React from "react";

interface AlertProps {
  className?: string;
  children?: React.ReactNode;
}

interface AlertDescriptionProps {
  className?: string;
  children?: React.ReactNode;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={`relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);

const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={`text-sm [&_p]:leading-relaxed ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);

Alert.displayName = "Alert";
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertDescription };