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
} from './components.js';

/**
 * Classic Professional Template Layout
 */
export function ClassicTemplate(data) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.basics?.name || 'Resume'} - ${data.basics?.label || 'Professional'}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
    </head>
    <body class="classic-template">
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
    </body>
    </html>
  `;
}

/**
 * Modern Professional Template Layout
 */
export function ModernTemplate(data) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.basics?.name || 'Resume'} - ${data.basics?.label || 'Professional'}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    </head>
    <body class="modern-template">
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
    </body>
    </html>
  `;
}

/**
 * Minimal Clean Template Layout
 */
export function MinimalTemplate(data) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.basics?.name || 'Resume'} - ${data.basics?.label || 'Professional'}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
    </head>
    <body class="minimal-template">
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
    </body>
    </html>
  `;
}

/**
 * Get template function by ID
 */
export function getTemplateFunction(templateId) {
  const templates = {
    'classic': ClassicTemplate,
    'modern': ModernTemplate,
    'minimal': MinimalTemplate
  };

  return templates[templateId] || templates['classic'];
}