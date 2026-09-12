import React from "react";

interface TerminalWindowProps {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const TerminalWindow: React.FC<TerminalWindowProps> = ({
  title,
  badge,
  children,
  className = "",
}) => {
  return (
    <div className={`terminal-window ${className}`.trim()}>
      <div className="terminal-header">
        <div className="terminal-controls">
          <span className="terminal-dot" />
          <span className="terminal-dot" />
          <span className="terminal-dot" />
        </div>
        <span>{title}</span>
        <div>{badge}</div>
      </div>
      {children}
    </div>
  );
};
