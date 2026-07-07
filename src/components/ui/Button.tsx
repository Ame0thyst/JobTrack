import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "glass" | "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon" | string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, isLoading, variant = "primary", className, disabled, ...props }, ref) => {
    let variantStyles = "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"; // primary/default
    if (variant === "secondary" || variant === "outline") {
      variantStyles = "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm";
    } else if (variant === "danger") {
      variantStyles = "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 shadow-sm";
    } else if (variant === "glass" || variant === "ghost") {
      variantStyles = "glass-panel text-slate-700 hover:text-indigo-600 shadow-sm";
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles} ${className || ""}`}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
