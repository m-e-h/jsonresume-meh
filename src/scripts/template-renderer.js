/**
 * Template Renderer Module
 * Handles dynamic template selection, data injection, and HTML rendering
 */

import {getSelectedTemplate, getAllTemplates} from '@config'
import {getTemplateFunction} from '@templates/layouts.js'

/**
 * Custom error class for template rendering errors
 */
export class TemplateRenderError extends Error {
	constructor(message, template = null, data = null) {
		super(message)
		this.name = 'TemplateRenderError'
		this.template = template
		this.data = data
		this.timestamp = new Date().toISOString()
	}
}

/**
 * Template Renderer Class
 * Handles template loading, data processing, and HTML generation
 */
export class TemplateRenderer {
	constructor() {
		this.templates = new Map()
		this.currentTemplate = null
		this.templateCache = new Map()
		this.isInitialized = false
		this.helpers = new Map()

		// Initialize built-in helpers
		this.initializeHelpers()
	}

	/**
   * Initialize the template renderer
   */
	async initialize() {
		try {
			console.log('🎨 Initializing Template Renderer...')

			// Load available templates
			await this.loadTemplates()

			// Set current template
			const selectedTemplate = getSelectedTemplate()
			this.currentTemplate = this.templates.get(selectedTemplate.id)

			this.isInitialized = true
			console.log(`✅ Template Renderer initialized with ${this.templates.size} templates`)
		} catch (error) {
			throw new TemplateRenderError(`Failed to initialize template renderer: ${error.message}`)
		}
	}

	/**
   * Load all available templates
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

			console.log(`📄 Loaded ${this.templates.size} component-based templates`)
		} catch (error) {
			throw new TemplateRenderError(`Failed to load templates: ${error.message}`)
		}
	}

	/**
   * Initialize built-in template helpers
   */
	initializeHelpers() {
		// Conditional helpers
		this.registerHelper('if', (condition, options) => {
			if (condition) {
				return options.fn ? options.fn(this) : ''
			}

			return options.inverse ? options.inverse(this) : ''
		})

		this.registerHelper('unless', (condition, options) => {
			if (!condition) {
				return options.fn ? options.fn(this) : ''
			}

			return options.inverse ? options.inverse(this) : ''
		})

		// Loop helpers
		this.registerHelper('each', (context, options) => {
			if (!Array.isArray(context)) {
				return ''
			}

			return context.map((item, index) => {
				const itemContext = {
					...item,
					'@index': index,
					'@first': index === 0,
					'@last': index === context.length - 1,
				}
				return options.fn ? options.fn(itemContext) : ''
			}).join('')
		})

		// String helpers
		this.registerHelper('capitalize', string_ => {
			if (typeof string_ !== 'string') {
				return string_
			}

			return string_.charAt(0).toUpperCase() + string_.slice(1).toLowerCase()
		})

		this.registerHelper('uppercase', string_ => {
			if (typeof string_ !== 'string') {
				return string_
			}

			return string_.toUpperCase()
		})

		this.registerHelper('lowercase', string_ => {
			if (typeof string_ !== 'string') {
				return string_
			}

			return string_.toLowerCase()
		})

		// Date helpers
		this.registerHelper('formatDate', (dateString, format = 'MM/YYYY') => {
			if (!dateString) {
				return ''
			}

			try {
				const date = new Date(dateString)
				if (isNaN(date.getTime())) {
					return dateString
				}

				const month = String(date.getMonth() + 1).padStart(2, '0')
				const year = date.getFullYear()

				switch (format) {
					case 'MM/YYYY': {
						return `${month}/${year}`
					}

					case 'YYYY': {
						return year.toString()
					}

					case 'Month YYYY': {
						return date.toLocaleDateString('en-US', {month: 'long', year: 'numeric'})
					}

					default: {
						return dateString
					}
				}
			} catch {
				return dateString
			}
		})

		// URL helpers
		this.registerHelper('domain', url => {
			if (!url) {
				return ''
			}

			try {
				const urlObject = new URL(url)
				return urlObject.hostname
			} catch {
				return url
			}
		})

		// Array helpers
		this.registerHelper('join', (array, separator = ', ') => {
			if (!Array.isArray(array)) {
				return ''
			}

			return array.join(separator)
		})

		this.registerHelper('length', array => {
			if (Array.isArray(array)) {
				return array.length
			}

			if (typeof array === 'object' && array !== null) {
				return Object.keys(array).length
			}

			return 0
		})

		// Comparison helpers
		this.registerHelper('eq', (a, b) => a === b)
		this.registerHelper('ne', (a, b) => a !== b)
		this.registerHelper('gt', (a, b) => a > b)
		this.registerHelper('lt', (a, b) => a < b)
		this.registerHelper('gte', (a, b) => a >= b)
		this.registerHelper('lte', (a, b) => a <= b)

		console.log(`🔧 Registered ${this.helpers.size} template helpers`)
	}

	/**
   * Register a custom template helper
   */
	registerHelper(name, helperFunction) {
		this.helpers.set(name, helperFunction)
	}

	/**
   * Get available templates
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
   */
	setTemplate(templateId) {
		const template = this.templates.get(templateId)
		if (!template) {
			throw new TemplateRenderError(`Template not found: ${templateId}`)
		}

		this.currentTemplate = template
		console.log(`🎨 Template changed to: ${template.name}`)
	}

	/**
   * Render template with data
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

			console.log(`✅ Template rendered successfully: ${template.name}`)
			return html
		} catch (error) {
			throw new TemplateRenderError(`Template rendering failed: ${error.message}`, templateId, data)
		}
	}

	/**
   * Process resume data for template rendering
   */
	processResumeData(data) {
		try {
			// Create a deep copy to avoid modifying original data
			const processedData = structuredClone(data)

			// Process work experience dates
			processedData.work &&= processedData.work.map(job => ({
				...job,
				formattedDates: this.formatDateRange(job.startDate, job.endDate),
				duration: this.calculateDuration(job.startDate, job.endDate),
				isCurrentJob: !job.endDate || job.endDate.toLowerCase() === 'present',
			}))

			// Process education dates
			processedData.education &&= processedData.education.map(edu => ({
				...edu,
				formattedDates: this.formatDateRange(edu.startDate, edu.endDate),
				duration: this.calculateDuration(edu.startDate, edu.endDate),
			}))

			// Process project dates
			processedData.projects &&= processedData.projects.map(project => ({
				...project,
				formattedDates: this.formatDateRange(project.startDate, project.endDate),
				duration: this.calculateDuration(project.startDate, project.endDate),
			}))

			// Process volunteer dates
			processedData.volunteer &&= processedData.volunteer.map(vol => ({
				...vol,
				formattedDates: this.formatDateRange(vol.startDate, vol.endDate),
				duration: this.calculateDuration(vol.startDate, vol.endDate),
			}))

			// Process skills with categories
			processedData.skills &&= processedData.skills.map(skill => ({
				...skill,
				levelNumber: this.convertSkillLevel(skill.level),
				categoryClass: this.generateCategoryClass(skill.name),
			}))

			// Process languages with proficiency
			processedData.languages &&= processedData.languages.map(lang => ({
				...lang,
				proficiencyLevel: this.convertLanguageProficiency(lang.fluency),
			}))

			// Add computed properties
			processedData.computed = {
				totalExperience: this.calculateTotalExperience(processedData.work),
				skillCategories: this.categorizeSkills(processedData.skills),
				hasPortfolio: Boolean(processedData.projects && processedData.projects.length > 0),
				hasEducation: Boolean(processedData.education && processedData.education.length > 0),
				hasAwards: Boolean(processedData.awards && processedData.awards.length > 0),
				hasCertifications: Boolean(processedData.certificates && processedData.certificates.length > 0),
				hasVolunteer: Boolean(processedData.volunteer && processedData.volunteer.length > 0),
			}

			return processedData
		} catch (error) {
			throw new TemplateRenderError(`Data processing failed: ${error.message}`, null, data)
		}
	}

	/**
   * Format date range for display
   */
	formatDateRange(startDate, endDate) {
		if (!startDate) {
			return ''
		}

		const start = this.formatDisplayDate(startDate)
		const end = endDate && endDate.toLowerCase() !== 'present'
			? this.formatDisplayDate(endDate)
			: 'Present'

		return end === 'Present' || !endDate ? `${start} – ${end}` : `${start} – ${end}`
	}

	/**
   * Format date for display
   */
	formatDisplayDate(dateString) {
		if (!dateString) {
			return ''
		}

		try {
			const date = new Date(dateString)
			if (isNaN(date.getTime())) {
				return dateString
			}

			return date.toLocaleDateString('en-US', {
				month: 'short',
				year: 'numeric',
			})
		} catch {
			return dateString
		}
	}

	/**
   * Calculate duration between dates
   */
	calculateDuration(startDate, endDate) {
		if (!startDate) {
			return ''
		}

		try {
			const start = new Date(startDate)
			const end = endDate && endDate.toLowerCase() !== 'present'
				? new Date(endDate)
				: new Date()

			if (isNaN(start.getTime()) || isNaN(end.getTime())) {
				return ''
			}

			const diffTime = Math.abs(end - start)
			const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
			const diffMonths = Math.floor(diffDays / 30)
			const diffYears = Math.floor(diffMonths / 12)

			if (diffYears > 0) {
				const remainingMonths = diffMonths % 12
				if (remainingMonths > 0) {
					return `${diffYears} yr${diffYears > 1 ? 's' : ''} ${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`
				}

				return `${diffYears} yr${diffYears > 1 ? 's' : ''}`
			}

			if (diffMonths > 0) {
				return `${diffMonths} mo${diffMonths > 1 ? 's' : ''}`
			}

			return '< 1 mo'
		} catch {
			return ''
		}
	}

	/**
   * Calculate total work experience
   */
	calculateTotalExperience(workHistory) {
		if (!Array.isArray(workHistory)) {
			return ''
		}

		let totalMonths = 0

		for (const job of workHistory) {
			if (job.startDate) {
				const start = new Date(job.startDate)
				const end = job.endDate && job.endDate.toLowerCase() !== 'present'
					? new Date(job.endDate)
					: new Date()

				if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
					const diffTime = Math.abs(end - start)
					const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30))
					totalMonths += diffMonths
				}
			}
		}

		const years = Math.floor(totalMonths / 12)
		const months = totalMonths % 12

		if (years > 0) {
			return months > 0
				? `${years}+ years`
				: `${years} year${years > 1 ? 's' : ''}`
		}

		if (months > 0) {
			return `${months} month${months > 1 ? 's' : ''}`
		}

		return ''
	}

	/**
   * Convert skill level to numeric value
   */
	convertSkillLevel(level) {
		if (!level) {
			return 0
		}

		const levelMap = {
			beginner: 1,
			novice: 1,
			intermediate: 2,
			advanced: 3,
			expert: 4,
			master: 5,
		}

		return levelMap[level.toLowerCase()] || 0
	}

	/**
   * Convert language proficiency to standardized format
   */
	convertLanguageProficiency(fluency) {
		if (!fluency) {
			return ''
		}

		const proficiencyMap = {
			elementary: 'Elementary',
			limited: 'Limited Working',
			professional: 'Professional Working',
			full: 'Full Professional',
			native: 'Native',
		}

		return proficiencyMap[fluency.toLowerCase()] || fluency
	}

	/**
   * Generate CSS class for skill category
   */
	generateCategoryClass(skillName) {
		return skillName.toLowerCase().replaceAll(/\s+/g, '-').replaceAll(/[^a-z\d-]/g, '')
	}

	/**
   * Categorize skills by type
   */
	categorizeSkills(skills) {
		if (!Array.isArray(skills)) {
			return {}
		}

		const categories = {}

		for (const skill of skills) {
			const category = skill.name || 'Other'
			categories[category] ||= []

			categories[category].push(skill)
		}

		return categories
	}

	/**
   * Get nested object value by path
   */
	getNestedValue(object, path) {
		let current = object
		const keys = path.split('.')
		for (const key of keys) {
			if (!current || current[key] === undefined) {
				return undefined
			}

			current = current[key]
		}

		return current
	}

	/**
   * Clear template cache
   */
	clearCache() {
		this.templateCache.clear()
		console.log('🧹 Template cache cleared')
	}

	/**
   * Get template statistics
   */
	getStats() {
		return {
			templatesLoaded: this.templates.size,
			helpersRegistered: this.helpers.size,
			cacheSize: this.templateCache.size,
			currentTemplate: this.currentTemplate?.name || 'None',
			isInitialized: this.isInitialized,
		}
	}
}

// Create and export singleton instance
export const templateRenderer = new TemplateRenderer()

// Export for direct instantiation if needed
export default TemplateRenderer
