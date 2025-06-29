/**
 * Data Processor Module for JSON Resume
 * Handles reading, parsing, validation, and processing of resume.json files
 *
 * @fileoverview This module provides data processing capabilities for JSON Resume format
 * @module DataProcessor
 * @requires @jsonresume/schema - Official JSON Resume schema validation
 * @requires fetch - Browser Fetch API for loading resume files
 * @requires performance - Browser Performance API for timing measurements
 */

import {validate as validateResume} from '@jsonresume/schema'

/**
 * Data Processor Class
 * Manages all resume data operations including loading, validation, and basic processing
 * @class
 */
class DataProcessor {
	/**
	 * Create a new DataProcessor instance
	 * @constructor
	 */
	constructor() {
		/** @type {Object|null} Currently loaded resume data */
		this.resumeData = null

		/** @type {boolean} Whether resume data has been successfully loaded */
		this.isLoaded = false

		/** @type {string|null} Last modified timestamp from HTTP headers */
		this.lastModified = null

		/** @type {Object|null} Result of resume data validation */
		this.validationResult = null

		/**
		 * Default values for missing optional fields in resume data
		 * @type {Object}
		 * @readonly
		 */
		this.defaultValues = {
			basics: {
				name: '',
				label: '',
				email: '',
				phone: '',
				summary: '',
				location: {},
				profiles: []
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
				lastModified: new Date().toISOString()
			}
		}
	}

	/**
	 * Load resume data from file with automatic fallback to sample data
	 * @param {string} [filePath='/resume.json'] - Path to resume.json file
	 * @returns {Promise<Object>} Promise that resolves to processed resume data object
	 * @throws {DataProcessorError} When file loading or processing fails
	 * @description If resume.json is not found (404) or if dev server returns HTML instead of JSON,
	 *              automatically falls back to sample.resume.json
	 * @example
	 * const processor = new DataProcessor();
	 * const result = await processor.loadResumeData('/my-resume.json');
	 * console.log(result.data, result.validation, result.metadata);
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
					{status: response.status, filePath}
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
					{originalError: error.message}
				)
			}

			if (error.name === 'TypeError' && error.message.includes('fetch')) {
				throw new DataProcessorError(
					`Network error loading resume file: ${error.message}`,
					'NETWORK_ERROR',
					{originalError: error.message}
				)
			}

			throw new DataProcessorError(
				`Unexpected error loading resume data: ${error.message}`,
				'UNKNOWN_ERROR',
				{originalError: error.message}
			)
		}
	}

	/**
	 * Process and validate resume data against JSON Resume schema
	 * @param {Object} rawData - Raw resume data from JSON file
	 * @returns {Promise<Object>} Promise that resolves to processed data with validation results
	 * @throws {DataProcessorError} When data processing fails
	 * @example
	 * const result = await processor.processResumeData(jsonData);
	 * // result = { data: {...}, validation: {...}, metadata: {...} }
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
					isValid: this.validationResult.isValid
				}
			}
		} catch (error) {
			throw new DataProcessorError(
				`Error processing resume data: ${error.message}`,
				'DATA_PROCESSING_ERROR',
				{originalError: error.message}
			)
		}
	}

	/**
	 * Validate resume data using official @jsonresume/schema package
	 * @param {Object} resumeData - The resume data to validate
	 * @returns {Promise<Object>} Promise that resolves to validation result object
	 * @example
	 * const validation = await processor.validateResumeData(resumeData);
	 * if (validation.isValid) {
	 *   console.log('Resume is valid!');
	 * } else {
	 *   console.log('Validation errors:', validation.errors);
	 * }
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
					schema: 'JSON Resume Schema (Official @jsonresume/schema)'
				}

				if (result.errors.length > 0) {
					console.error(`❌ Resume validation failed with ${result.errors.length} errors`, result.errors)
				}

				resolve(result)
			})
		})
	}

	/**
	 * Apply default values for missing optional fields in resume data
	 * @param {Object} data - Raw resume data that may have missing fields
	 * @returns {Object} Resume data with default values applied for missing fields
	 * @example
	 * const resumeWithDefaults = processor.applyDefaults(incompleteResumeData);
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
					...result[section]
				}
			}
		}

		// Ensure meta section has required fields
		result.meta = result.meta ? {...this.defaultValues.meta, ...result.meta} : {...this.defaultValues.meta}

		return result
	}
}

/**
 * Custom error class for data processor specific errors
 * @class
 * @extends Error
 */
class DataProcessorError extends Error {
	/**
	 * Create a new DataProcessorError
	 * @param {string} message - The error message
	 * @param {string} code - Error code for categorization
	 * @param {Object} [details={}] - Additional error details and context
	 * @example
	 * throw new DataProcessorError('File not found', 'FILE_NOT_FOUND', {path: '/resume.json'});
	 */
	constructor(message, code, details = {}) {
		super(message)

		/** @type {string} Error name identifier */
		this.name = 'DataProcessorError'

		/** @type {string} Error code for categorization and handling */
		this.code = code

		/** @type {Object} Additional error details and context */
		this.details = details

		/** @type {string} ISO timestamp when error occurred */
		this.timestamp = new Date().toISOString()
	}
}

/**
 * Singleton instance of DataProcessor for use throughout the application
 * @type {DataProcessor}
 * @example
 * import { dataProcessor } from './data-processor.js';
 * const result = await dataProcessor.loadResumeData();
 */
export const dataProcessor = new DataProcessor()

// Export class and error for direct usage
export {DataProcessor, DataProcessorError}

/**
 * Default export of the singleton DataProcessor instance
 * @type {DataProcessor}
 */
export default dataProcessor
