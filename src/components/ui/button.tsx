import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline" | "danger";
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        {
          "bg-[color:var(--color-brand-primary)] text-white hover:bg-[color:var(--color-brand-primary-strong)]": variant === "default",
          "bg-[color:var(--color-brand-surface)] text-[color:var(--color-brand-primary)] hover:bg-[#e8d9ff]": variant === "secondary",
          "border border-[color:var(--color-border-soft)] bg-white text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-brand-surface)]": variant === "outline",
          "bg-rose-600 text-white hover:bg-rose-700": variant === "danger",
        },
        className,
      )}
      {...props}
    />
  );
}
