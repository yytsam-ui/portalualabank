import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-[color:var(--color-border-soft)] bg-white px-3 py-2.5 text-sm text-[color:var(--color-text-primary)] outline-none transition placeholder:text-[color:var(--color-text-muted)] focus:border-[color:var(--color-brand-primary)] focus:ring-2 focus:ring-[color:var(--color-brand-surface)]",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
