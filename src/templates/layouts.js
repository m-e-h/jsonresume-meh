/**
 * @fileoverview Resume Template Layouts
 * Functions that compose components into complete resume templates
 * @author m-e-h
 * @version 1.0.0
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
	interests
} from './components/index.js'

/**
 * Minimal Clean Template Layout
 * A simple, single-column layout that displays all sections in a clean, minimal style
 * @param {Object} data - Resume data object containing all resume information
 * @returns {string} HTML string for the minimal template layout
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
 * A two-column layout with main content on the left and supplementary information on the right
 * @param {Object} data - Resume data object containing all resume information
 * @returns {string} HTML string for the classic template layout
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
 * A modern single-column layout with skills and qualifications prominently displayed at the top
 * @param {Object} data - Resume data object containing all resume information
 * @returns {string} HTML string for the modern template layout
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
 * Returns the appropriate template function based on the provided template ID
 * @param {string} templateId - The ID of the template to retrieve ('minimal', 'classic', or 'modern')
 * @returns {Function} Template function that accepts data and returns HTML string
 * @example
 * const templateFunc = getTemplateFunction('minimal');
 * const html = templateFunc(resumeData);
 */
export function getTemplateFunction(templateId) {
	/** @type {Object<string, Function>} Map of template IDs to their corresponding functions */
	const templates = {
		minimal: minimalTemplate,
		classic: classicTemplate,
		modern: modernTemplate
	}

	return templates[templateId] || templates.minimal
}
