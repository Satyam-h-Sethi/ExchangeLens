import React from "react";
import { techStack } from "@/data/portfolio";

export const StackCategorized: React.FC = () => {
  return (
    <section className="section" id="stack" aria-label="Engineering Stack">
      <div className="container">
        <div className="section-header">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-dot" /> 06 / Technical Stack
            </div>
            <h2 className="section-title">
              Tools organized <span>by production context.</span>
            </h2>
          </div>
          <p className="lead">
            Categorized around systems engineering, financial data validation, test harnesses, and applied AI reasoning.
          </p>
        </div>

        <div className="stack-grid">
          {techStack.map((category) => (
            <div className="stack-category-card" key={category.category}>
              <h3>{category.category}</h3>
              <p className="cat-desc">{category.description}</p>

              <div className="stack-items-list">
                {category.items.map((item) => (
                  <div className="stack-item-row" key={item.name}>
                    <span className="stack-item-name">{item.name}</span>
                    <span className="stack-item-context">{item.context}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
