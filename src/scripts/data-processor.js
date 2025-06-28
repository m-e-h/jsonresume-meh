/**
 * Data Processor for JSON Resume
 * Handles reading, parsing, validation, and processing of resume.json
 */

import {validate as validateResume} from '@jsonresume/schema'

/**
 * Data Processor Class
 * Manages all resume data operations including loading, validation, and basic processing
 */
class DataProcessor {
	constructor() {
		this.resumeData = null
		this.isLoaded = false
		this.lastModified = null
		this.validationResult = null

		// Default values for missing optional fields
		this.defaultValues = {
			basics: {
				name: '',
				label: '',
				email: '',
				phone: '',
				summary: '',
				location: {},
				profiles: [],
			},
			work: [],
			volunteer: [],
			education: [],
			awards: [],
			certificates: [],
			publications: [],
			skills: [],
			languages: [],
			interests: [],
			references: [],
			projects: [],
			meta: {
				canonical: '',
				version: '1.0.0',
				lastModified: new Date().toISOString(),
			},
		}

		console.log('📊 Data Processor initialized')
	}

	/**
   * Load resume data from file
   * @param {string} filePath - Path to resume.json file (defaults to /resume.json)
   * @returns {Promise<Object>} Processed resume data
   * @description If resume.json is not found (404) or if dev server returns HTML instead of JSON,
   *              automatically falls back to sample.resume.json
   */
	async loadResumeData(filePath = '/resume.json') {
		try {
			console.log(`📄 Loading resume data from ${filePath}...`)
			const startTime = performance.now()

			// Fetch the resume.json file
			const response = await fetch(filePath)

			// Check if the response is actually JSON or if Vite is serving HTML fallback
			const contentType = response.headers.get('content-type') || ''
			const isHtmlResponse = contentType.includes('text/html')

			if (
				!response.ok
				|| (response.ok && isHtmlResponse && filePath.endsWith('.json'))
			) {
				// If resume.json is not found or Vite returns HTML instead of JSON, try fallback to sample.resume.json
				if (
					(response.status === 404 || isHtmlResponse)
					&& filePath === '/resume.json'
				) {
					console.warn('⚠️  resume.json not found, falling back to sample.resume.json')
					return await this.loadResumeData('/sample.resume.json')
				}

				throw new DataProcessorError(
					`Failed to load resume file: ${response.status} ${response.statusText}`,
					'FILE_LOAD_ERROR',
					{status: response.status, filePath},
				)
			}

			// Get the last modified timestamp
			this.lastModified
        = response.headers.get('last-modified') || new Date().toISOString()

			// Parse JSON
			const rawData = await response.json()
			const loadTime = performance.now() - startTime

			console.log(`✅ Resume file loaded in ${Math.round(loadTime)}ms`)

			// Process and validate the data
			return await this.processResumeData(rawData)
		} catch (error) {
			if (error instanceof DataProcessorError) {
				throw error
			}

			// Handle different types of errors
			if (error instanceof SyntaxError) {
				throw new DataProcessorError(
					`Invalid JSON format in resume file: ${error.message}`,
					'JSON_PARSE_ERROR',
					{originalError: error.message},
				)
			}

			if (error.name === 'TypeError' && error.message.includes('fetch')) {
				throw new DataProcessorError(
					`Network error loading resume file: ${error.message}`,
					'NETWORK_ERROR',
					{originalError: error.message},
				)
			}

			throw new DataProcessorError(
				`Unexpected error loading resume data: ${error.message}`,
				'UNKNOWN_ERROR',
				{originalError: error.message},
			)
		}
	}

	/**
   * Process and validate resume data
   * @param {Object} rawData - Raw resume data from JSON file
   * @returns {Promise<Object>} Processed and validated resume data
   */
	async processResumeData(rawData) {
		try {
			console.log('🔍 Processing and validating resume data...')
			const startTime = performance.now()

			// Apply default values for missing optional fields
			const processedData = this.applyDefaults(rawData)

			// Validate the data against JSON Resume schema
			this.validationResult = await this.validateResumeData(processedData)

			// Store the processed data
			this.resumeData = processedData
			this.isLoaded = true

			const processTime = performance.now() - startTime
			console.log(`✅ Resume data processed in ${Math.round(processTime)}ms`)

			return {
				data: processedData,
				validation: this.validationResult,
				metadata: {
					loadedAt: new Date().toISOString(),
					lastModified: this.lastModified,
					processingTime: Math.round(processTime),
					isValid: this.validationResult.isValid,
				},
			}
		} catch (error) {
			throw new DataProcessorError(
				`Error processing resume data: ${error.message}`,
				'DATA_PROCESSING_ERROR',
				{originalError: error.message},
			)
		}
	}

	/**
	 * Validate resume data using official @jsonresume/schema package
	 * @param {Object} resumeData - The resume data to validate
	 * @returns {Promise<Object>} Validation result with isValid flag and errors
	 */
	validateResumeData(resumeData) {
		const startTime = performance.now()

		return new Promise(resolve => {
			validateResume(resumeData, (errors, isValid) => {
				const endTime = performance.now()
				const validationTime = Math.round(endTime - startTime)

				const result = {
					isValid: isValid === true,
					errors: errors || [],
					validationTime,
					schema: 'JSON Resume Schema (Official @jsonresume/schema)',
				}

				if (result.errors.length > 0) {
					console.error(`❌ Resume validation failed with ${result.errors.length} errors`, result.errors)
				}

				resolve(result)
			})
		})
	}

	/**
	 * Apply default values for missing optional fields
	 * @param {Object} data - Raw resume data
	 * @returns {Object} Data with defaults applied
	 */
	applyDefaults(data) {
		if (!data || typeof data !== 'object') {
			console.warn('⚠️  Invalid resume data, using defaults')
			return {...this.defaultValues}
		}

		const result = {...data}

		// Apply defaults for each section
		for (const section of Object.keys(this.defaultValues)) {
			if (!result[section]) {
				result[section] = Array.isArray(this.defaultValues[section])
					? []
					: {...this.defaultValues[section]}
			} else if (
				typeof result[section] === 'object'
				&& !Array.isArray(result[section])
			) {
				// Merge defaults for object sections
				result[section] = {
					...this.defaultValues[section],
					...result[section],
				}
			}
		}

		// Ensure meta section has required fields
		result.meta = result.meta ? {...this.defaultValues.meta, ...result.meta} : {...this.defaultValues.meta}

		return result
	}

	/**
   * Get current resume data
   * @returns {Object|null} Current resume data or null if not loaded
   */
	getResumeData() {
		return this.resumeData
	}

	/**
   * Get validation result
   * @returns {Object|null} Validation result or null if not validated
   */
	getValidationResult() {
		return this.validationResult
	}

	/**
   * Check if data is loaded
   * @returns {boolean} Whether data is loaded
   */
	isDataLoaded() {
		return this.isLoaded
	}

	/**
   * Reload resume data
   * @param {string} filePath - Optional file path
   * @returns {Promise<Object>} Reloaded resume data
   */
	async reload(filePath) {
		console.log('🔄 Reloading resume data...')
		this.isLoaded = false
		this.resumeData = null
		this.validationResult = null

		return this.loadResumeData(filePath)
	}

	/**
   * Clean up resources
   */
	cleanup() {
		this.resumeData = null
		this.isLoaded = false
		this.validationResult = null
	}
}

/**
 * Custom error class for data processor errors
 */
class DataProcessorError extends Error {
	constructor(message, code, details = {}) {
		super(message)
		this.name = 'DataProcessorError'
		this.code = code
		this.details = details
		this.timestamp = new Date().toISOString()
	}
}

// Export singleton instance and class
export const dataProcessor = new DataProcessor()
export {DataProcessor, DataProcessorError}
export default dataProcessor
