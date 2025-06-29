/**
 * @fileoverview Template Renderer Module
 * Handles dynamic template selection, data injection, and HTML rendering
 * @author m-e-h
 * @version 1.0.0
 */

import {getSelectedTemplate, getAllTemplates} from '@config'
import {getTemplateFunction} from '@templates/layouts.js'
import {formatDateRange} from '@templates/utils/helpers.js'

/**
 * Custom error class for template rendering errors
 * @class TemplateRenderError
 * @extends {Error}
 */
export class TemplateRenderError extends Error {
	/**
	 * Creates an instance of TemplateRenderError
	 * @param {string} message - Error message
	 * @param {string|null} [template=null] - Template that caused the error
	 * @param {Object|null} [data=null] - Data that caused the error
	 */
	constructor(message, template = null, data = null) {
		super(message)
		/** @type {string} */
		this.name = 'TemplateRenderError'
		/** @type {string|null} */
		this.template = template
		/** @type {Object|null} */
		this.data = data
		/** @type {string} */
		this.timestamp = new Date().toISOString()
	}
}

/**
 * Template Renderer Class
 * Handles template loading, data processing, and HTML generation
 * @class TemplateRenderer
 */
export class TemplateRenderer {
	/**
	 * Creates an instance of TemplateRenderer
	 */
	constructor() {
		/** @type {Map<string, Object>} */
		this.templates = new Map()
		/** @type {Object|null} */
		this.currentTemplate = null
		/** @type {Map<string, string>} */
		this.templateCache = new Map()
		/** @type {boolean} */
		this.isInitialized = false
	}

	/**
	 * Initialize the template renderer
	 * @async
	 * @throws {TemplateRenderError} When initialization fails
	 */
	async initialize() {
		try {
			// Load available templates
			await this.loadTemplates()

			// Set current template
			const selectedTemplate = getSelectedTemplate()
			this.currentTemplate = this.templates.get(selectedTemplate.id)

			this.isInitialized = true
		} catch (error) {
			throw new TemplateRenderError(`Failed to initialize template renderer: ${error.message}`)
		}
	}

	/**
	 * Load all available templates
	 * @async
	 * @throws {TemplateRenderError} When template loading fails
	 */
	async loadTemplates() {
		try {
			const availableTemplates = getAllTemplates()

			// No need to load HTML files anymore - we use JavaScript components
			for (const template of availableTemplates) {
				this.templates.set(template.id, {
					...template,
					templateFunction: getTemplateFunction(template.id),
					loaded: true,
				})
			}
		} catch (error) {
			throw new TemplateRenderError(`Failed to load templates: ${error.message}`)
		}
	}

	/**
	 * Get available templates
	 * @returns {Array<Object>} Array of available template objects
	 */
	getAvailableTemplates() {
		return [...this.templates.values()].map(template => ({
			id: template.id,
			name: template.name,
			description: template.description,
			preview: template.preview,
		}))
	}

	/**
	 * Set the current template
	 * @param {string} templateId - Template ID to set as current
	 * @throws {TemplateRenderError} When template is not found
	 */
	setTemplate(templateId) {
		const template = this.templates.get(templateId)
		if (!template) {
			throw new TemplateRenderError(`Template not found: ${templateId}`)
		}

		this.currentTemplate = template
	}

	/**
	 * Render template with data
	 * @async
	 * @param {Object} data - Resume data to render
	 * @param {string|null} [templateId=null] - Optional template ID to use instead of current
	 * @returns {Promise<string>} Rendered HTML string
	 * @throws {TemplateRenderError} When rendering fails
	 */
	async render(data, templateId = null) {
		try {
			if (!this.isInitialized) {
				await this.initialize()
			}

			// Use specified template or current template
			const template = templateId ? this.templates.get(templateId) : this.currentTemplate
			if (!template) {
				throw new TemplateRenderError(`Template not available: ${templateId || 'current'}`)
			}

			// Check if template function is available
			if (!template.templateFunction) {
				throw new TemplateRenderError(`Template function not available: ${template.name || templateId || 'current'}`)
			}

			// Process the resume data
			const processedData = this.processResumeData(data)

			// Render using the component function
			const html = template.templateFunction(processedData)
			return html
		} catch (error) {
			throw new TemplateRenderError(`Template rendering failed: ${error.message}`, templateId, data)
		}
	}

	/**
	 * Process resume data for template rendering
	 * Adds formatted date ranges to work, education, projects, and volunteer experience
	 * @param {Object} data - Raw resume data
	 * @returns {Object} Processed resume data with formatted dates
	 * @throws {TemplateRenderError} When data processing fails
	 */
	processResumeData(data) {
		try {
			// Create a deep copy to avoid modifying original data
			const processedData = structuredClone(data)

			// Process work experience dates
			processedData.work &&= processedData.work.map(job => ({
				...job,
				formattedDates: formatDateRange(job.startDate, job.endDate),
			}))

			// Process education dates
			processedData.education &&= processedData.education.map(edu => ({
				...edu,
				formattedDates: formatDateRange(edu.startDate, edu.endDate),
			}))

			// Process project dates
			processedData.projects &&= processedData.projects.map(project => ({
				...project,
				formattedDates: formatDateRange(project.startDate, project.endDate),
			}))

			// Process volunteer dates
			processedData.volunteer &&= processedData.volunteer.map(vol => ({
				...vol,
				formattedDates: formatDateRange(vol.startDate, vol.endDate),
			}))

			return processedData
		} catch (error) {
			throw new TemplateRenderError(`Data processing failed: ${error.message}`, null, data)
		}
	}
}

// Create and export singleton instance
export const templateRenderer = new TemplateRenderer()

// Export for direct instantiation if needed
export default TemplateRenderer
