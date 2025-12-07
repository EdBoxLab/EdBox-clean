import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  icon?: React.ElementType;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  className = "",
  variant = "primary",
  icon: Icon,
  disabled,
  title,
  isLoading,
  ...props
}) => {
  const baseStyle = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50",
    secondary: "bg-zinc-700 hover:bg-zinc-600 text-zinc-100",
    ghost: "hover:bg-zinc-700/50 text-zinc-300 hover:text-white",
    outline: "border border-zinc-600 text-zinc-300 hover:border-zinc-400 hover:text-white",
    danger: "bg-red-900/50 text-red-200 hover:bg-red-900 border border-red-800"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      title={title}
      {...props}
    >
      {isLoading ? <Loader2 size={16} className="animate-spin" /> : Icon && <Icon size={16} />}
      {children}
    </button>
  );
};
