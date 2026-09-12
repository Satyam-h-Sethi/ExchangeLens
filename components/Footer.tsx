import React from "react";
import { profile } from "@/data/portfolio";
import { Button } from "./ui/Button";

export const Footer: React.FC = () => {
  return (
    <footer className="footer" id="contact" aria-label="Contact and Colophon">
      <div className="container">
        <div className="footer-top">
          <div className="footer-cta">
            <div className="eyebrow">
              <span className="eyebrow-dot" /> 09 / Get in Touch
            </div>
            <h2>Let&apos;s build what&apos;s next.</h2>
            <p>
              AI engineering, financial infrastructure, market data systems, or technical quality leadership—if the domain is complex and correctness is non-negotiable, let&apos;s connect.
            </p>
          </div>

          <div className="footer-contact-actions">
            <Button href={`mailto:${profile.email}`} variant="primary">
              {profile.email} ↗
            </Button>
            <Button href={profile.linkedin} variant="secondary" external>
              LinkedIn ↗
            </Button>
            <Button href={profile.github} variant="ghost" external>
              GitHub ↗
            </Button>
            {profile.resumeAvailable && (
              <Button href={profile.resumeUrl} variant="ghost" external>
                Resume ↗
              </Button>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} {profile.name} · Institutional-Grade Systems Portfolio
          </div>
          <div className="footer-links">
            <a href={profile.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href={profile.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <a href={`mailto:${profile.email}`}>
              Email
            </a>
            <a href="#top">Back to top ↑</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
