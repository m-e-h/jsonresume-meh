/**
 * Resume Template Layouts
 * Functions that compose components into complete resume templates
 */

import {
	header,
	summary,
	workExperience,
	education,
	skills,
	languages,
	volunteerExperience,
	publications,
	awards,
	certificates,
	projects,
	references,
	interests,
} from './components/index.js'

/**
 * Minimal Clean Template Layout
 */
export function minimalTemplate(data) {
	return `
    <div class="resume-wrap">
      ${header(data)}
      ${summary(data)}
      ${workExperience(data)}
      ${skills(data)}
      ${projects(data)}
      ${education(data)}
      ${volunteerExperience(data)}
      ${publications(data)}
      ${languages(data)}
      ${awards(data)}
      ${certificates(data)}
      ${references(data)}
      ${interests(data)}
    </div>
  `
}

/**
 * Classic Professional Template Layout
 */
export function classicTemplate(data) {
	return `
    <div class="resume-wrap">
      ${header(data)}

      <main class="resume-main">
        <div class="left-column">
          ${summary(data)}
          ${workExperience(data)}
          ${projects(data)}
          ${education(data)}
        </div>

        <div class="right-column">
          ${skills(data)}
          ${languages(data)}
          ${certificates(data)}
          ${awards(data)}
          ${publications(data)}
          ${volunteerExperience(data)}
          ${references(data)}
          ${interests(data)}
        </div>
      </main>
    </div>
  `
}

/**
 * Modern Professional Template Layout
 */
export function modernTemplate(data) {
	return `
    <div class="resume-wrap">
      ${header(data)}
      ${skills(data)}
      ${languages(data)}
      ${certificates(data)}
      ${interests(data)}
      ${summary(data)}
      ${workExperience(data)}
      ${projects(data)}
      ${volunteerExperience(data)}
      ${education(data)}
      ${publications(data)}
      ${awards(data)}
      ${references(data)}
    </div>
  `
}

/**
 * Get template function by ID
 */
export function getTemplateFunction(templateId) {
	const templates = {
		minimal: minimalTemplate,
		classic: classicTemplate,
		modern: modernTemplate,
	}

	return templates[templateId] || templates.minimal
}
