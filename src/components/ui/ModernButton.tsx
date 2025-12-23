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
    primary: "bg-primary hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/20",
    secondary: "bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border/50",
    ghost: "hover:bg-accent text-muted-foreground hover:text-foreground",
    outline: "border border-border text-foreground hover:border-primary hover:text-primary",
    danger: "bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border border-destructive/20"
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
