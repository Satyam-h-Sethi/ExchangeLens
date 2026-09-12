"use client";

import React from "react";
import { profile } from "@/data/portfolio";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/Button";

export const Navigation: React.FC = () => {
  return (
    <header className="nav-wrapper">
      <div className="container nav-container">
        <a href="#top" className="nav-logo" aria-label="Satyam Sethi - Home">
          <strong>SATYAM SETHI</strong>
          <span>AI ENG · CAPITAL MARKETS · DATA SYSTEMS</span>
        </a>

        <nav className="nav-links" aria-label="Main Navigation">
          <a href="#work">Work</a>
          <a href="#inspector">Inspector</a>
          <a href="#domain">Domain</a>
          <a href="#experience">Experience</a>
          <a href="#stack">Stack</a>
          <a href="#philosophy">Philosophy</a>
          <a href="#about">About</a>
        </nav>

        <div className="nav-actions">
          {profile.resumeAvailable && (
            <Button
              href={profile.resumeUrl}
              variant="ghost"
              size="sm"
              external
            >
              Resume
            </Button>
          )}
          <ThemeToggle />
          <Button href="#contact" variant="primary" size="sm">
            Contact ↗
          </Button>
        </div>
      </div>
    </header>
  );
};
