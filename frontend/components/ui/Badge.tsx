import React from "react";

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "xs" | "sm";
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-800 text-slate-300 border-slate-700/80",
  primary: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  danger: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  info: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  neutral: "bg-slate-900/80 text-slate-400 border-slate-800",
};

const dotStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-400",
  primary: "bg-indigo-400",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-rose-400",
  info: "bg-cyan-400",
  neutral: "bg-slate-500",
};

export function Badge({
  variant = "default",
  size = "xs",
  dot = false,
  className = "",
  children,
  ...props
}: BadgeProps) {
  const sizeClasses =
    size === "xs"
      ? "text-[10px] px-2 py-0.5 leading-none"
      : "text-xs px-2.5 py-1 leading-tight";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors ${variantStyles[variant]} ${sizeClasses} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]} shrink-0`}
        />
      )}
      <span>{children}</span>
    </span>
  );
}
