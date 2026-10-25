import React from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-sm shadow-indigo-600/30 border border-indigo-500/50",
  secondary:
    "bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-slate-200 border border-slate-700/80",
  outline:
    "bg-transparent hover:bg-slate-800/60 active:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600",
  ghost:
    "bg-transparent hover:bg-slate-800/50 active:bg-slate-800 text-slate-400 hover:text-slate-200 border-transparent",
  danger:
    "bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-sm shadow-rose-600/30 border border-rose-500/50",
};

const sizeStyles = {
  sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5",
  md: "text-xs px-4 py-2 rounded-lg gap-2 font-medium",
  lg: "text-sm px-5 py-2.5 rounded-xl gap-2 font-medium",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
}
