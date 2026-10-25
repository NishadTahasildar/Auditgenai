import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  helperText,
  icon,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full space-y-1.5 text-xs">
      {label && (
        <label
          htmlFor={inputId}
          className="block font-medium text-slate-300 tracking-wide"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full bg-slate-950/80 border text-slate-200 placeholder-slate-600 rounded-lg px-3 py-2 transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
            icon ? "pl-9" : ""
          } ${
            error
              ? "border-rose-500/60 focus:ring-rose-500 focus:border-rose-500"
              : "border-slate-800 hover:border-slate-700"
          } ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-[11px] text-rose-400 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
