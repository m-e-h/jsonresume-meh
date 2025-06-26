/**
 * Resume Template Layouts
 * Functions that compose components into complete resume templates
 */

import {
  Header,
  Summary,
  WorkExperience,
  Education,
  Skills,
  Languages,
  VolunteerExperience,
  Publications,
  Awards,
  Certificates,
  Projects,
  References,
  Interests
} from './components/index.js';

/**
 * Minimal Clean Template Layout
 */
export function MinimalTemplate(data) {
  return `
    <div class="resume-wrap">
      ${Header(data)}
      ${Summary(data)}
      ${WorkExperience(data)}
      ${Skills(data)}
      ${Projects(data)}
      ${Education(data)}
      ${VolunteerExperience(data)}
      ${Publications(data)}
      ${Languages(data)}
      ${Awards(data)}
      ${Certificates(data)}
      ${References(data)}
      ${Interests(data)}
    </div>
  `;
}

/**
 * Classic Professional Template Layout
 */
export function ClassicTemplate(data) {
  return `
    <div class="resume-wrap">
      ${Header(data)}

      <main class="resume-main">
        <div class="left-column">
          ${Summary(data)}
          ${WorkExperience(data)}
          ${Projects(data)}
          ${Education(data)}
        </div>

        <div class="right-column">
          ${Skills(data)}
          ${Languages(data)}
          ${Certificates(data)}
          ${Awards(data)}
          ${Publications(data)}
          ${VolunteerExperience(data)}
          ${References(data)}
          ${Interests(data)}
        </div>
      </main>
    </div>
  `;
}

/**
 * Modern Professional Template Layout
 */
export function ModernTemplate(data) {
  return `
    <div class="resume-wrap">
      ${Header(data)}
      ${Skills(data)}
      ${Languages(data)}
      ${Certificates(data)}
      ${Interests(data)}
      ${Summary(data)}
      ${WorkExperience(data)}
      ${Projects(data)}
      ${VolunteerExperience(data)}
      ${Education(data)}
      ${Publications(data)}
      ${Awards(data)}
      ${References(data)}
    </div>
  `;
}

/**
 * Get template function by ID
 */
export function getTemplateFunction(templateId) {
  const templates = {
    'minimal': MinimalTemplate,
    'classic': ClassicTemplate,
    'modern': ModernTemplate
  };

  return templates[templateId] || templates['classic'];
}