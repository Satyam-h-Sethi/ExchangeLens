import React from "react";
import { experience } from "@/data/portfolio";
import { Badge } from "./ui/Badge";

export const ExperienceTimeline: React.FC = () => {
  return (
    <section className="section" id="experience" aria-label="Professional Experience">
      <div className="container">
        <div className="section-header">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-dot" /> 05 / Career Progression
            </div>
            <h2 className="section-title">
              Technical leadership <span>& ownership.</span>
            </h2>
          </div>
          <p className="lead">
            Progressive trajectory across trading lifecycle validation, enterprise test automation architectures, and technical quality leadership at ION Group.
          </p>
        </div>

        <div className="timeline">
          {experience.map((item) => (
            <div className="timeline-item" key={item.role + item.period}>
              <span className="timeline-dot" />
              <div className="timeline-header">
                <div>
                  <h3>{item.role}</h3>
                  <div className="timeline-company">
                    {item.company} · {item.team}
                  </div>
                </div>
                <span className="period">{item.period}</span>
              </div>

              <p className="timeline-desc">{item.description}</p>

              <ul className="timeline-highlights">
                {item.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>

              <div className="tags-list">
                {item.skills.map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
