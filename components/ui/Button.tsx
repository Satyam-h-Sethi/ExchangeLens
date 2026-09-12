import React from "react";

interface ButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "default" | "sm";
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "secondary",
  size = "default",
  children,
  className = "",
  external = false,
  href,
  ...props
}) => {
  const variantClass = `button-${variant}`;
  const sizeClass = size === "sm" ? "button-sm" : "";
  const combinedClass = `button ${variantClass} ${sizeClass} ${className}`.trim();

  if (href) {
    return (
      <a
        href={href}
        className={combinedClass}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={combinedClass}>
      {children}
    </button>
  );
};
