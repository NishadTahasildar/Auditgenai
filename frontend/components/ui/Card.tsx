import React from "react";

export interface CardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: "default" | "elevated" | "interactive";
  headerAction?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
}

export function Card({
  variant = "default",
  title,
  description,
  headerAction,
  className = "",
  children,
  ...props
}: CardProps) {
  const baseClasses =
    "rounded-xl border transition-all duration-150 backdrop-blur-md";

  const variantClasses = {
    default: "bg-slate-900/60 border-slate-800/80 shadow-sm",
    elevated:
      "bg-slate-900/80 border-slate-800 shadow-md shadow-black/20",
    interactive:
      "bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 cursor-pointer shadow-sm",
  }[variant];

  return (
    <div className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
      {(title || description || headerAction) && (
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-start justify-between gap-4">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-slate-100 tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-slate-400 mt-0.5">{description}</p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
