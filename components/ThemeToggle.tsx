"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const dark = saved ? saved === "dark" : !window.matchMedia("(prefers-color-scheme: light)").matches;
    setIsDark(dark);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return <button className="icon-button" onClick={toggle} aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}>
    <span aria-hidden="true">{isDark ? "◐" : "◑"}</span>
  </button>;
}
