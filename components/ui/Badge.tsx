import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "pass" | "warn" | "fail" | "accent";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  className = "",
}) => {
  const variantClass = variant === "default" ? "" : `badge-${variant}`;
  return <span className={`badge ${variantClass} ${className}`.trim()}>{children}</span>;
};
