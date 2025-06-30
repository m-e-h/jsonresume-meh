/**
 * @fileoverview Main Entry Point for JSON Resume Builder
 * Initializes the application and coordinates all modules
 * @author m-e-h
 * @version 1.0.0
 */

import {getSelectedTemplate, templateConfig} from '@config'
import {DataProcessor} from './scripts/data-processor.js'
import {TemplateRenderer} from './scripts/template-renderer.js'
import {UIManager} from './scripts/ui-manager.js'
import './styles/resume.css'

/**
 * Main Application Class
 * Coordinates all modules and manages the application lifecycle
 * @class ResumeBuilder
 */
class ResumeBuilder {
	/**
	 * Creates an instance of ResumeBuilder
	 * Initializes all core modules and sets up initial state
	 */
	constructor() {
		this.currentTemplate = null
		this.resumeData = null
		this.dataProcessor = new DataProcessor()
		this.templateRenderer = new TemplateRenderer()
		this.uiManager = new UIManager()
	}

	/**
	 * Initialize the application
	 * Sets up error handling, loads resume data, initializes templates, and renders the initial view
	 * @async
	 * @throws {Error} When initialization fails
	 */
	async init() {
		try {
			// Load and validate resume data
			await this.loadResumeData()

			// Initialize template system
			await this.initializeTemplateSystem()

			// Set up UI event listeners
			this.setupEventListeners()

			// Render the initial template
			await this.renderTemplate()
		} catch (error) {
			console.error('❌ Failed to initialize Resume Builder:', error)
			this.uiManager.showInitializationError(error)
		}
	}

	/**
	 * Load and validate resume data
	 * Uses DataProcessor to fetch, parse, and validate resume.json
	 * @async
	 * @throws {Error} When resume data loading or validation fails
	 */
	async loadResumeData() {
		try {
			// Use DataProcessor to load and validate resume data
			const result = await this.dataProcessor.loadResumeData('/resume.json')

			// Extract the actual resume data from the result
			/** @type {Object} Processed resume data */
			this.resumeData = result.data
			/** @type {Object} Resume validation results */
			this.validationResult = result.validation
			/** @type {Object} Additional metadata about the resume */
			this.metadata = result.metadata
		} catch (error) {
			throw new Error(`Resume data loading failed: ${error.message}`)
		}
	}

	/**
	 * Initialize template system
	 * Sets up template renderer and loads the currently selected template
	 * @async
	 */
	async initializeTemplateSystem() {
		await this.templateRenderer.initialize()

		this.currentTemplate = getSelectedTemplate()
	}

	/**
	 * Set up UI event listeners
	 * Configures template selector and print button based on configuration
	 */
	setupEventListeners() {
		// Template selector (if in development mode)
		if (templateConfig.buildOptions.includeTemplateSelector) {
			if (!this.templateRenderer.isInitialized) {
				return
			}

			const availableTemplates = this.templateRenderer.getAvailableTemplates()
			this.uiManager.setupTemplateSelector(
				availableTemplates,
				this.currentTemplate.id,
				this.switchTemplate.bind(this)
			)
		}

		// Print button
		this.uiManager.setupPrintButton(this.printResume.bind(this))
	}

	/**
	 * Switch to a different template
	 * Changes the active template and re-renders the resume
	 * @async
	 * @param {string} templateId - ID of the template to switch to
	 */
	async switchTemplate(templateId) {
		try {
			this.templateRenderer.setTemplate(templateId)
			this.currentTemplate = this.templateRenderer.currentTemplate

			// Re-render with new template (this will also update the title)
			await this.renderTemplate()
		} catch (error) {
			console.error('Template switch failed:', error)
		}
	}

	/**
	 * Print the resume using browser's print functionality
	 * Triggers the browser's native print dialog
	 */
	printResume() {
		try {
			// Trigger the browser's print dialog
			globalThis.print()
		} catch (error) {
			console.error('Print failed:', error)
		}
	}

	/**
	 * Render the current template with resume data
	 * Updates document title and renders the HTML using TemplateRenderer and UIManager
	 * @async
	 * @throws {Error} When template rendering fails
	 */
	async renderTemplate() {
		try {
			// Update document title first
			this.updateDocumentTitle()

			// Use TemplateRenderer to render the template with data
			const renderedHTML = await this.templateRenderer.render(this.resumeData)

			// UIManager renders the complete template into the app container
			this.uiManager.renderTemplate(renderedHTML, this.currentTemplate.id)
		} catch (error) {
			throw new Error(`Template rendering failed: ${error.message}`)
		}
	}

	/**
	 * Update the document title based on resume data
	 * Generates a professional title format: "Name_Resume" or "Name_Resume_Prospect"
	 */
	updateDocumentTitle() {
		try {
			// Generate title with underscores - same logic as templates
			const nameWithUnderscores = this.resumeData.basics?.name ? this.resumeData.basics.name.replaceAll(/\s+/g, '') : 'Resume'
			const prospect = this.resumeData.meta?.prospect ? this.resumeData.meta.prospect.replaceAll(/\s+/g, '') : ''
			const title = prospect ? `${nameWithUnderscores}_Resume_${prospect}` : `${nameWithUnderscores}_Resume`

			document.title = title
		} catch (error) {
			console.error('Failed to update document title:', error)
			// Fallback to a basic title
			document.title = 'Resume'
		}
	}
}

/**
 * Initialize the application when DOM is ready
 * Creates a new ResumeBuilder instance and starts the initialization process
 * @async
 */
document.addEventListener('DOMContentLoaded', async () => {
	const app = new ResumeBuilder()
	await app.init()

	// Make app instance globally available for debugging
	globalThis.resumeBuilder = app
})

/**
 * Hot module replacement for development
 * Enables hot reloading during development with Vite
 */
if (import.meta.hot) {
	import.meta.hot.accept()
}
