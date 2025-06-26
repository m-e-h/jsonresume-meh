/**
 * Template Configuration for JSON Resume Builder
 * Defines available templates and their properties for build-time selection
 */

export const templates = {
	minimal: {
		id: 'minimal',
		name: 'Minimal',
		description: 'Ultra-clean, minimalist design focusing on content clarity',
		htmlFile: 'src/templates/template-minimal.html',
		styleFile: 'src/styles/templates/minimal.scss',
		preview: 'assets/previews/minimal-preview.png',
		features: [
			'Ultra-clean typography',
			'Maximum white space',
			'Focus on content',
			'Minimal visual elements',
		],
		recommended: ['academia', 'research', 'creative', 'freelance'],
	},

	classic: {
		id: 'classic',
		name: 'Classic',
		description: 'Traditional, professional resume layout with clean typography',
		htmlFile: 'src/templates/template-classic.html',
		styleFile: 'src/styles/templates/classic.scss',
		preview: 'assets/previews/classic-preview.png',
		features: [
			'Traditional two-column layout',
			'Professional typography',
			'Clear section headers',
			'Optimized for ATS systems',
		],
		recommended: ['corporate', 'finance', 'legal', 'consulting'],
	},

	modern: {
		id: 'modern',
		name: 'Modern',
		description: 'Contemporary design with subtle colors and modern typography',
		htmlFile: 'src/templates/template-modern.html',
		styleFile: 'src/styles/templates/modern.scss',
		preview: 'assets/previews/modern-preview.png',
		features: [
			'Contemporary color scheme',
			'Modern typography stack',
			'Visual hierarchy emphasis',
			'Balanced white space',
		],
		recommended: ['tech', 'design', 'marketing', 'startup'],
	},
}

export const templateConfig = {
	// Default template to use if none specified
	defaultTemplate: 'minimal',

	// Template selection can be overridden via environment variable
	// VITE_RESUME_TEMPLATE=modern npm run build
	selectedTemplate: (import.meta !== undefined && import.meta.env?.VITE_RESUME_TEMPLATE)
		|| (globalThis.global !== undefined && globalThis.importMeta?.env?.VITE_RESUME_TEMPLATE)
		|| 'minimal',

	// Build configuration
	buildOptions: {
		// Whether to build all templates or just the selected one
		buildAllTemplates: (import.meta !== undefined && import.meta.env?.VITE_BUILD_ALL_TEMPLATES === 'true')
			|| (globalThis.global !== undefined && globalThis.importMeta?.env?.VITE_BUILD_ALL_TEMPLATES === 'true'),

		// Output naming convention for multiple templates
		multiTemplateNaming: '[template]-resume',

		// Whether to include template selector in the build
		includeTemplateSelector: (import.meta !== undefined && import.meta.env?.DEV)
			|| (globalThis.global !== undefined && globalThis.importMeta?.env?.DEV),
	},

	// Shared template settings
	sharedSettings: {
		// Font loading strategy
		fontStrategy: 'preload', // 'preload' | 'fallback' | 'swap'

		// Print optimization
		printOptimized: true,

		// Responsive breakpoints
		breakpoints: {
			mobile: '768px',
			tablet: '1024px',
			desktop: '1200px',
		},

		// Print settings
		printSettings: {
			format: 'A4',
			orientation: 'portrait',
			margin: '0.5in',
			printBackground: true,
		},
	},
}

/**
 * Get the currently selected template configuration
 * @returns {Object} Template configuration object
 */
export function getSelectedTemplate() {
	const selectedId = templateConfig.selectedTemplate
	const template = templates[selectedId]

	if (!template) {
		console.warn(`Template "${selectedId}" not found, falling back to default`)
		return templates[templateConfig.defaultTemplate]
	}

	return template
}

/**
 * Get all available templates
 * @returns {Array} Array of template configuration objects
 */
export function getAllTemplates() {
	return Object.values(templates)
}

/**
 * Validate template configuration
 * @param {string} templateId - Template ID to validate
 * @returns {boolean} Whether the template is valid
 */
export function isValidTemplate(templateId) {
	return templateId in templates
}

export default templateConfig
